import pytest
from django.urls import reverse
from rest_framework import status
from apps.accounts.models import User

@pytest.mark.django_db
class TestAuthAPI:
    def test_signup(self, api_client):
        url = reverse('signup')
        data = {
            'email': 'new@example.com',
            'password': 'password123',
            'full_name': 'New User'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.count() == 1
        assert User.objects.get().email == 'new@example.com'

    def test_login(self, api_client, user):
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'password123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'id' in response.data

    def test_login_invalid_credentials(self, api_client, user):
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('logout')
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK

    def test_me(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
