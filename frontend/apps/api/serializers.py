from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate


class RegisterSerializer(serializers.ModelSerializer):

    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):

        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                "email": "Email already exists."
            })

        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({
                "username": "Username already exists."
            })

        return data

    def create(self, validated_data):

        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False
        )

        return user


from rest_framework import serializers
from django.contrib.auth import authenticate


class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        username = attrs.get("username")
        password = attrs.get("password")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "message": "Invalid username or password."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "message": "Please verify your account first 🫡."
            })

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            raise serializers.ValidationError({
                "message": "Invalid username or password."
            })

        attrs["user"] = user
        return attrs