from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MoodViewSet, HabitViewSet, EntryViewSet, HabitLogViewSet,
    CustomAuthToken, current_user, register_user, analytics_dashboard
)

router = DefaultRouter()
router.register(r'moods', MoodViewSet, basename='mood')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'entries', EntryViewSet, basename='entry')
router.register(r'habit-logs', HabitLogViewSet, basename='habitlog')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('auth/register/', register_user, name='register_user'),
    path('auth/user/', current_user, name='current_user'),
    path('analytics/dashboard/', analytics_dashboard, name='analytics_dashboard'),
    path('entries/timeline/', EntryViewSet.as_view({'get': 'timeline'}), name='entries_timeline'),
    path('entries/monthly-stats/', EntryViewSet.as_view({'get': 'monthly_stats'}), name='monthly_stats'),
]