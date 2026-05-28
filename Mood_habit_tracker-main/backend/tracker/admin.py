from django.contrib import admin
from .models import Mood, Habit, Entry, HabitLog

@admin.register(Mood)
class MoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'value')
    list_filter = ('value',)
    search_fields = ('name',)

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'user__username')
    date_hierarchy = 'created_at'

@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'time', 'mood', 'created_at')
    list_filter = ('mood', 'date')
    search_fields = ('user__username', 'note')
    date_hierarchy = 'date'

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'entry', 'completed', 'created_at')
    list_filter = ('completed',)
    search_fields = ('habit__name', 'note')