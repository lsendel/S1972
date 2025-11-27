import pytest
from django.contrib.auth import get_user_model
from apps.accounts.models import User

@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        User = get_user_model()
        user = User.objects.create_user(email="test@example.com", password="password123")
        assert user.email == "test@example.com"
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser
        assert user.check_password("password123")

    def test_create_superuser(self):
        User = get_user_model()
        admin = User.objects.create_superuser(email="admin@example.com", password="password123")
        assert admin.email == "admin@example.com"
        assert admin.is_active
        assert admin.is_staff
        assert admin.is_superuser

    def test_create_user_invalid_email(self):
        User = get_user_model()
        with pytest.raises(ValueError):
            User.objects.create_user(email="", password="password123")

    def test_str_method(self):
        User = get_user_model()
        user = User.objects.create_user(email="test@example.com", password="password123")
        assert str(user) == "test@example.com"
