from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Mood, Habit, Entry, HabitLog

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'date_joined']
        read_only_fields = ['date_joined']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class MoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mood
        fields = '__all__'

class HabitSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Habit
        fields = '__all__'

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class EntrySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    mood_name = serializers.CharField(source='mood.name', read_only=True)
    mood_emoji = serializers.CharField(source='mood.emoji', read_only=True)
    mood_id = serializers.PrimaryKeyRelatedField(source='mood', read_only=True)
    datetime = serializers.SerializerMethodField()
    
    class Meta:
        model = Entry
        fields = '__all__'
        read_only_fields = ['user']
    
    def get_datetime(self, obj):
        if obj.time:
            return f"{obj.date} {obj.time.strftime('%H:%M')}"
        return str(obj.date)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data.pop('user', None)
        return super().update(instance, validated_data)

class HabitLogSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source='habit.name', read_only=True)
    entry_date = serializers.DateField(source='entry.date', read_only=True)

    class Meta:
        model = HabitLog
        fields = '__all__'