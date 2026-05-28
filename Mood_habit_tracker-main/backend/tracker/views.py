from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
import calendar
from collections import defaultdict
from .models import Mood, Habit, Entry, HabitLog
from .serializers import (
    UserSerializer, MoodSerializer, HabitSerializer, 
    EntrySerializer, HabitLogSerializer
)

class MoodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Mood.objects.all()
    serializer_class = MoodSerializer
    permission_classes = [AllowAny]

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

class EntryViewSet(viewsets.ModelViewSet):
    serializer_class = EntrySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return Entry.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        period = request.query_params.get('period', 'month')
        
        try:
            # Определяем период
            if period == 'week':
                start_date = timezone.now().date() - timedelta(days=7)
            elif period == 'month':
                start_date = timezone.now().date() - timedelta(days=30)
            else:
                start_date = timezone.now().date() - timedelta(days=365)

            entries = Entry.objects.filter(
                user=user, date__gte=start_date
            ).select_related('mood')

            # Основная статистика настроения
            mood_avg = entries.aggregate(avg=Avg('mood__value'))['avg'] or 0
            total_entries = entries.count()
            
            # Распределение по настроениям
            mood_distribution = {}
            moods = Mood.objects.all()
            
            for mood in moods:
                count = entries.filter(mood=mood).count()
                percentage = round((count / total_entries * 100) if total_entries > 0 else 0, 1)
                mood_distribution[mood.name] = {
                    'count': count,
                    'emoji': mood.emoji,
                    'percentage': percentage
                }

            # Статистика по дням недели
            # В Django: 1=Воскресенье, 2=Понедельник, ..., 7=Суббота
            day_names = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
            day_stats = {}
            
            for i in range(1, 8):  # 1-7 для дней недели в Django
                day_entries = entries.filter(date__week_day=i)
                avg = day_entries.aggregate(avg=Avg('mood__value'))['avg']
                day_stats[day_names[i-1]] = round(avg, 1) if avg else 0

            # Статистика по времени суток
            time_stats = {
                'morning': entries.filter(time__range=('05:00', '11:59')).count(),
                'afternoon': entries.filter(time__range=('12:00', '16:59')).count(),
                'evening': entries.filter(time__range=('17:00', '21:59')).count(),
                'night': entries.filter(Q(time__gte='22:00') | Q(time__lt='05:00')).count(),
            }

            # Получаем последние 7 дней для тренда
            mood_trend = []
            for i in range(6, -1, -1):
                date = timezone.now().date() - timedelta(days=i)
                day_entries = entries.filter(date=date)
                if day_entries.exists():
                    avg = day_entries.aggregate(avg=Avg('mood__value'))['avg']
                    mood_trend.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'avg_mood': round(avg, 1) if avg else 0
                    })
                else:
                    mood_trend.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'avg_mood': None
                    })

            # Статистика привычек
            habits = Habit.objects.filter(user=user, is_active=True)
            habit_stats = []
            
            for habit in habits:
                logs = HabitLog.objects.filter(
                    habit=habit, 
                    entry__date__gte=start_date
                )
                total = logs.count()
                completed = logs.filter(completed=True).count()
                rate = (completed / total * 100) if total > 0 else 0
                
                habit_stats.append({
                    'id': habit.id,
                    'name': habit.name,
                    'completion_rate': round(rate, 1),
                    'total': total,
                    'completed': completed
                })

            return Response({
                'success': True,
                'mood_avg': round(mood_avg, 1),
                'total_entries': total_entries,
                'mood_distribution': mood_distribution,
                'day_stats': day_stats,
                'time_stats': time_stats,
                'mood_trend': mood_trend,
                'habit_stats': habit_stats,
                'period': period
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    @action(detail=False, methods=['get'])
    def timeline(self, request):
        user = request.user
        limit = int(request.query_params.get('limit', 30))
        
        entries = Entry.objects.filter(user=user).order_by('-date', '-time')[:limit]
        serializer = self.get_serializer(entries, many=True)
        
        return Response({
            'success': True,
            'entries': serializer.data
        })

    @action(detail=False, methods=['get'])
    def monthly_stats(self, request):
        user = request.user
        months = int(request.query_params.get('months', 6))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months*30)
        
        entries = Entry.objects.filter(
            user=user, 
            date__range=[start_date, end_date]
        ).select_related('mood')
        
        # Группировка по месяцам
        monthly_data = defaultdict(list)
        for entry in entries:
            month_key = entry.date.strftime('%Y-%m')
            monthly_data[month_key].append(entry.mood.value)
        
        result = []
        for month, values in sorted(monthly_data.items()):
            if values:
                result.append({
                    'month': month,
                    'avg_mood': round(sum(values) / len(values), 1),
                    'count': len(values)
                })
        
        return Response({
            'success': True,
            'stats': result
        })

class HabitLogViewSet(viewsets.ModelViewSet):
    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return HabitLog.objects.filter(habit__user=self.request.user)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })

@api_view(['POST'])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def current_user(request):
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email
        })
    return Response({'error': 'Not authenticated'}, status=401)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    try:
        user = request.user
        
        # Получаем привычки и их статистику
        habits = Habit.objects.filter(user=user, is_active=True)
        habit_analytics = []
        
        for habit in habits:
            logs = HabitLog.objects.filter(habit=habit)
            total = logs.count()
            completed = logs.filter(completed=True).count()
            
            # Статистика за последние 30 дней
            recent_logs = logs.filter(created_at__gte=timezone.now() - timedelta(days=30))
            recent_total = recent_logs.count()
            recent_completed = recent_logs.filter(completed=True).count()
            
            habit_analytics.append({
                'id': habit.id,
                'name': habit.name,
                'total_logs': total,
                'completed': completed,
                'completion_rate': round((completed / total * 100) if total > 0 else 0, 1),
                'recent_completion_rate': round((recent_completed / recent_total * 100) if recent_total > 0 else 0, 1)
            })
        
        # Статистика настроения за последние 7 дней
        entries = Entry.objects.filter(user=user)
        mood_trend = []
        
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            day_entries = entries.filter(date=date)
            if day_entries.exists():
                avg = day_entries.aggregate(avg=Avg('mood__value'))['avg']
                mood_trend.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avg_mood': round(avg, 1) if avg else 0
                })
            else:
                mood_trend.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avg_mood': None
                })
        
        # Общая статистика
        total_entries = entries.count()
        active_habits = habits.count()
        
        # Распределение настроений
        mood_distribution = {}
        moods = Mood.objects.all()
        
        for mood in moods:
            count = entries.filter(mood=mood).count()
            percentage = round((count / total_entries * 100) if total_entries > 0 else 0, 1)
            mood_distribution[mood.name] = {
                'count': count,
                'emoji': mood.emoji,
                'percentage': percentage
            }
        
        return Response({
            'success': True,
            'habit_analytics': habit_analytics,
            'mood_trend': mood_trend,
            'total_entries': total_entries,
            'active_habits': active_habits,
            'mood_distribution': mood_distribution
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)