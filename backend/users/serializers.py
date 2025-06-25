# serializers.py
from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'wallet_address', 'name', 'email',
            'address', 'phone_number', 'birth_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'wallet_address', 'created_at', 'updated_at']