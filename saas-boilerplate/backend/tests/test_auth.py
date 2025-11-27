"""
Tests for authentication endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from apps.accounts.models import User


@pytest.mark.django_db
class TestSignup:
    """Tests for user signup."""

    def test_signup_success(self, api_client):
        """Test successful user signup."""
        url = reverse('signup')
        data = {
            'email': 'newuser@example.com',
            'password': 'securepass123456',
            'full_name': 'New User'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newuser@example.com').exists()

        # User should not be verified initially
        user = User.objects.get(email='newuser@example.com')
        assert user.email_verified is False

    def test_signup_duplicate_email(self, api_client, user):
        """Test signup with duplicate email fails."""
        url = reverse('signup')
        data = {
            'email': user.email,
            'password': 'securepass123456',
            'full_name': 'Duplicate User'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_weak_password(self, api_client):
        """Test signup with weak password fails."""
        url = reverse('signup')
        data = {
            'email': 'newuser@example.com',
            'password': '123',  # Too short
            'full_name': 'New User'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    """Tests for user login."""

    def test_login_success(self, api_client, user):
        """Test successful login."""
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123456'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        # Session should be created
        assert api_client.session.session_key is not None

    def test_login_wrong_password(self, api_client, user):
        """Test login with wrong password fails."""
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        """Test login with nonexistent user fails."""
        url = reverse('login')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogout:
    """Tests for user logout."""

    def test_logout_success(self, authenticated_client):
        """Test successful logout."""
        url = reverse('logout')

        response = authenticated_client.post(url)

        assert response.status_code == status.HTTP_200_OK

    def test_logout_unauthenticated(self, api_client):
        """Test logout without authentication fails."""
        url = reverse('logout')

        response = api_client.post(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserMe:
    """Tests for current user endpoint."""

    def test_get_current_user(self, authenticated_client, user):
        """Test getting current user data."""
        url = reverse('user_me')

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['full_name'] == user.full_name

    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user without authentication fails."""
        url = reverse('user_me')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestPasswordReset:
    """Tests for password reset flow."""

    def test_request_password_reset(self, api_client, user):
        """Test requesting a password reset."""
        url = reverse('password_reset')
        data = {'email': user.email}

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        # Should not reveal whether user exists
        assert 'email' in response.data.get('detail', '').lower()

    def test_request_password_reset_nonexistent(self, api_client):
        """Test requesting password reset for nonexistent user."""
        url = reverse('password_reset')
        data = {'email': 'nonexistent@example.com'}

        response = api_client.post(url, data, format='json')

        # Should still return success to prevent email enumeration
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPermissions:
    """Tests for authentication permissions."""

    def test_authenticated_only_endpoints(self, api_client):
        """Test that authenticated endpoints reject unauthenticated requests."""
        protected_urls = [
            reverse('logout'),
            reverse('user_me'),
        ]

        for url in protected_urls:
            response = api_client.get(url)
            assert response.status_code in [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_405_METHOD_NOT_ALLOWED  # If GET not allowed
            ], f"URL {url} should require authentication"
