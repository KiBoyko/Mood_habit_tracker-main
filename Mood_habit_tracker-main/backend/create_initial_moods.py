import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mood_tracker.settings')
django.setup()

from tracker.models import Mood

# Удалить старые настроения, если есть
Mood.objects.all().delete()

moods_data = [
    {'name': 'Отлично', 'emoji': '😊', 'value': 10},
    {'name': 'Хорошо', 'emoji': '🙂', 'value': 8},
    {'name': 'Нормально', 'emoji': '😐', 'value': 6},
    {'name': 'Плохо', 'emoji': '😕', 'value': 4},
    {'name': 'Ужасно', 'emoji': '😞', 'value': 2},
]

for mood in moods_data:
    Mood.objects.create(**mood)
    print(f"✓ Создано настроение: {mood['name']}")

print(f"\n✅ Создано {len(moods_data)} настроений!")
