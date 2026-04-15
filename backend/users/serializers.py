from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'created_at')
        read_only_fields = ('id', 'role', 'created_at')

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('username', 'password', 'email', 'phone_number')

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            role='USER'  # Default role
        )
        return user

class UpdateRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('role',)
