import pytest
from django.urls import reverse
from rest_framework import status
from apps.accounts.tests.factories import UserFactory

@pytest.mark.django_db
class TestAuthentication:
    def test_login(self, api_client):
        user = UserFactory(email='test@example.com', password='password123')
        user.set_password('password123')
        user.save()

        url = reverse('login')
        data = {'email': 'test@example.com', 'password': 'password123'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data is None

    def test_signup(self, api_client):
        url = reverse('signup')
        data = {
            'email': 'newuser@example.com',
            'password': 'password123',
            'full_name': 'New User'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newuser@example.com'

    def test_logout(self, authenticated_client):
        url = reverse('logout')
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
