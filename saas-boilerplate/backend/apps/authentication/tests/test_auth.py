import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestAuthFlow:
    def setup_method(self):
        self.client = APIClient()
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.me_url = reverse('me')

    def test_signup_success(self):
        data = {
            "email": "newuser@example.com",
            "password": "complexpassword123",
            "full_name": "New User"
        }
        response = self.client.post(self.signup_url, data)
        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert User.objects.filter(email="newuser@example.com").exists()
        assert User.objects.get(email="newuser@example.com").full_name == "New User"

    def test_login_success(self):
        user = User.objects.create_user(email="login@example.com", password="password123")
        data = {
            "email": "login@example.com",
            "password": "password123"
        }
        response = self.client.post(self.login_url, data)
        assert response.status_code == status.HTTP_200_OK
        # The serializer doesn't return key, views likely handle login/session or return user data.
        # We can check if sessionid cookie is present if using SessionAuth, or check response data.

    def test_me_endpoint(self):
        user = User.objects.create_user(email="me@example.com", password="password123")
        self.client.force_authenticate(user=user)
        response = self.client.get(self.me_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "me@example.com"

    def test_me_endpoint_unauthenticated(self):
        response = self.client.get(self.me_url)
        assert response.status_code == status.HTTP_403_FORBIDDEN or response.status_code == status.HTTP_401_UNAUTHORIZED
