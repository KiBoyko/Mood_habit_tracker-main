from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Mood(models.Model):
    name = models.CharField(max_length=50, unique=True)
    emoji = models.CharField(max_length=5)
    value = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])

    def __str__(self):
        return f"{self.emoji} {self.name}"

class Habit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.user.username}: {self.name}"

class Entry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entries')
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)  # НОВОЕ ПОЛЕ
    mood = models.ForeignKey(Mood, on_delete=models.CASCADE)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-time']

    def __str__(self):
        return f"{self.user.username} - {self.date} {self.time or ''}: {self.mood.name}"

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name='habit_logs')
    completed = models.BooleanField(default=False)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  # НОВОЕ ПОЛЕ

    class Meta:
        unique_together = ['habit', 'entry']

    def __str__(self):
        return f"{self.habit.name} - {self.entry.date}: {'✅' if self.completed else '❌'}"