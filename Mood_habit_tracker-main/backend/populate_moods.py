import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mood_tracker.settings')
django.setup()

from tracker.models import Mood

def create_initial_moods():
    moods = [
        {'name': 'Отлично', 'emoji': '😊', 'value': 10},
        {'name': 'Хорошо', 'emoji': '🙂', 'value': 8},
        {'name': 'Нормально', 'emoji': '😐', 'value': 6},
        {'name': 'Плохо', 'emoji': '😕', 'value': 4},
        {'name': 'Ужасно', 'emoji': '😞', 'value': 2},
    ]
    
    for mood_data in moods:
        mood, created = Mood.objects.get_or_create(
            name=mood_data['name'],
            defaults={
                'emoji': mood_data['emoji'],
                'value': mood_data['value']
            }
        )
        if created:
            print(f'✅ Создано настроение: {mood.emoji} {mood.name}')
        else:
            print(f'ℹ️  Настроение уже существует: {mood.emoji} {mood.name}')

if __name__ == '__main__':
    create_initial_moods()