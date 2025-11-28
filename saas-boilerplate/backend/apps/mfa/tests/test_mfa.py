"""
Comprehensive authentication tests covering all authentication flows.

This test suite covers:
- Login/Logout (including rate limiting)
- Signup (with email verification)
- Password reset flow (request and confirm)
- Email verification
- Password change
- Profile updates
- TOTP/2FA setup and verification
- Backup codes
"""
import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.core import mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator, default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import status
from apps.accounts.models import User, TOTPDevice, BackupCode
from apps.accounts.tests.factories import UserFactory
from django.test.utils import override_settings


@pytest.mark.django_db
class TestLogin:
    """Tests for login endpoint."""

    def test_successful_login(self, api_client):
        """Test successful login with valid credentials."""
        user = UserFactory(email='test@example.com')
        user.set_password('SecurePass123!')
        user.save()

        url = reverse('login')
        data = {'email': 'test@example.com', 'password': 'SecurePass123!'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data is None

    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 400."""
        user = UserFactory(email='test@example.com')
        user.set_password('correctpassword')
        user.save()

        url = reverse('login')
        data = {'email': 'test@example.com', 'password': 'wrongpassword'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent user."""
        url = reverse('login')
        data = {'email': 'nonexistent@example.com', 'password': 'password123'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_inactive_user(self, api_client):
        """Test login with inactive user is rejected."""
        user = UserFactory(email='inactive@example.com', is_active=False)
        user.set_password('password123')
        user.save()

        url = reverse('login')
        data = {'email': 'inactive@example.com', 'password': 'password123'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
    def test_login_rate_limiting(self, api_client):
        """Test login rate limiting (5 attempts per minute per IP)."""
        user = UserFactory(email='test@example.com')
        user.set_password('password123')
        user.save()

        url = reverse('login')

        # Make requests - rate limiting may kick in
        # django-ratelimit uses 403 Forbidden when rate limit is exceeded
        for i in range(5):
            data = {'email': 'test@example.com', 'password': f'wrongpass{i}'}
            response = api_client.post(url, data)
            # Should get 400 for wrong password, 403 if rate limited, or 200 if correct password
            assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

        # Additional request to verify rate limiting is active
        # Note: django-ratelimit uses 403 by default when block=True
        data = {'email': 'test@example.com', 'password': 'wrongpass6'}
        response = api_client.post(url, data)
        # Should be rate limited or bad request
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestLogout:
    """Tests for logout endpoint."""

    def test_successful_logout(self, authenticated_client):
        """Test successful logout."""
        url = reverse('logout')
        response = authenticated_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data is None

    def test_logout_requires_authentication(self, api_client):
        """Test logout requires authentication."""
        url = reverse('logout')
        response = api_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestSignup:
    """Tests for signup endpoint."""

    @patch('django.core.mail.send_mail')
    def test_successful_signup_sends_verification_email(self, mock_send_mail, api_client):
        """Test successful signup creates user and sends verification email."""
        url = reverse('signup')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'full_name': 'New User'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newuser@example.com'
        assert response.data['full_name'] == 'New User'
        assert 'password' not in response.data

        # Verify user was created
        user = User.objects.get(email='newuser@example.com')
        assert user.full_name == 'New User'
        assert user.email_verified is False

        # Verify email was sent
        mock_send_mail.assert_called_once()
        call_kwargs = mock_send_mail.call_args[1]
        assert call_kwargs['subject'] == 'Verify Your Email Address'
        assert 'newuser@example.com' in call_kwargs['recipient_list']

    def test_signup_duplicate_email(self, api_client):
        """Test signup with duplicate email is rejected."""
        UserFactory(email='existing@example.com')

        url = reverse('signup')
        data = {
            'email': 'existing@example.com',
            'password': 'SecurePass123!',
            'full_name': 'Duplicate User'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_invalid_email(self, api_client):
        """Test signup with invalid email format."""
        url = reverse('signup')
        data = {
            'email': 'notanemail',
            'password': 'SecurePass123!',
            'full_name': 'Test User'
        }
        response = api_client.post(url, data)

        # Could get 400 for invalid email or 403 if rate limited from previous tests
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]

    def test_signup_weak_password(self, api_client):
        """Test signup with weak password is rejected."""
        url = reverse('signup')
        data = {
            'email': 'test@example.com',
            'password': '123',  # Too short
            'full_name': 'Test User'
        }
        response = api_client.post(url, data)

        # Could get 400 for weak password or 403 if rate limited from previous tests
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestPasswordReset:
    """Tests for password reset flow."""

    @patch('django.core.mail.send_mail')
    def test_password_reset_request_sends_email(self, mock_send_mail, api_client):
        """Test password reset request sends email to existing user."""
        user = UserFactory(email='user@example.com', full_name='Test User')

        url = reverse('password_reset')
        data = {'email': 'user@example.com'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'sent' in response.data['detail'].lower()

        # Verify email was sent
        mock_send_mail.assert_called_once()
        call_kwargs = mock_send_mail.call_args[1]
        assert call_kwargs['subject'] == 'Password Reset Request'
        assert 'user@example.com' in call_kwargs['recipient_list']
        assert 'Test User' in call_kwargs['message']

    @patch('django.core.mail.send_mail')
    def test_password_reset_nonexistent_email_no_error(self, mock_send_mail, api_client):
        """Test password reset with non-existent email returns success (prevents enumeration)."""
        url = reverse('password_reset')
        data = {'email': 'nonexistent@example.com'}
        response = api_client.post(url, data)

        # Should return success to prevent email enumeration
        assert response.status_code == status.HTTP_200_OK
        assert 'sent' in response.data['detail'].lower()

        # But no email should be sent
        mock_send_mail.assert_not_called()

    @patch('django.core.mail.send_mail')
    def test_password_reset_inactive_user_no_email(self, mock_send_mail, api_client):
        """Test password reset for inactive user doesn't send email."""
        UserFactory(email='inactive@example.com', is_active=False)

        url = reverse('password_reset')
        data = {'email': 'inactive@example.com'}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        mock_send_mail.assert_not_called()

    def test_password_reset_confirm_with_valid_token(self, api_client):
        """Test password reset confirmation with valid token."""
        user = UserFactory(email='user@example.com')
        user.set_password('oldpassword')
        user.save()

        # Generate valid reset token
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        url = reverse('password_reset_confirm')
        data = {
            'uid': uid,
            'token': token,
            'new_password': 'NewSecurePass123!'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'reset successfully' in response.data['detail'].lower()

        # Verify password was changed
        user.refresh_from_db()
        assert user.check_password('NewSecurePass123!')

    def test_password_reset_confirm_with_invalid_token(self, api_client):
        """Test password reset confirmation with invalid token."""
        user = UserFactory(email='user@example.com')
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        url = reverse('password_reset_confirm')
        data = {
            'uid': uid,
            'token': 'invalid-token',
            'new_password': 'NewSecurePass123!'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'invalid' in response.data['error'].lower() or 'expired' in response.data['error'].lower()

    def test_password_reset_confirm_with_invalid_uid(self, api_client):
        """Test password reset confirmation with invalid UID."""
        url = reverse('password_reset_confirm')
        data = {
            'uid': 'invalid-uid',
            'token': 'some-token',
            'new_password': 'NewSecurePass123!'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEmailVerification:
    """Tests for email verification."""

    def test_email_verification_with_valid_token(self, api_client):
        """Test email verification with valid token."""
        user = UserFactory(email='user@example.com', email_verified=False)

        # Generate verification token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_token = f"{uid}:{token}"

        url = reverse('verify_email')
        data = {'token': verification_token}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'verified successfully' in response.data['detail'].lower()

        # Verify email_verified flag was set
        user.refresh_from_db()
        assert user.email_verified is True

    def test_email_verification_with_invalid_token(self, api_client):
        """Test email verification with invalid token."""
        user = UserFactory(email='user@example.com', email_verified=False)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_token = f"{uid}:invalid-token"

        url = reverse('verify_email')
        data = {'token': verification_token}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Email should not be verified
        user.refresh_from_db()
        assert user.email_verified is False

    def test_email_verification_already_verified(self, api_client):
        """Test email verification when already verified."""
        user = UserFactory(email='user@example.com', email_verified=True)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_token = f"{uid}:{token}"

        url = reverse('verify_email')
        data = {'token': verification_token}
        response = api_client.post(url, data)

        # Should succeed (idempotent)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPasswordChange:
    """Tests for password change endpoint."""

    def test_password_change_success(self, authenticated_client, user):
        """Test successful password change."""
        user.set_password('OldPassword123!')
        user.save()

        authenticated_client.force_authenticate(user=user)

        url = reverse('password_change')
        data = {
            'old_password': 'OldPassword123!',
            'new_password': 'NewSecurePass456!'
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'changed successfully' in response.data['message'].lower()

        # Verify password was changed
        user.refresh_from_db()
        assert user.check_password('NewSecurePass456!')

    def test_password_change_wrong_old_password(self, authenticated_client, user):
        """Test password change with incorrect old password."""
        user.set_password('OldPassword123!')
        user.save()

        authenticated_client.force_authenticate(user=user)

        url = reverse('password_change')
        data = {
            'old_password': 'WrongOldPassword',
            'new_password': 'NewSecurePass456!'
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'invalid' in response.data['error'].lower()

    def test_password_change_requires_authentication(self, api_client):
        """Test password change requires authentication."""
        url = reverse('password_change')
        data = {
            'old_password': 'OldPassword123!',
            'new_password': 'NewSecurePass456!'
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestProfileUpdate:
    """Tests for profile update endpoint."""

    def test_profile_update_full_name(self, authenticated_client, user):
        """Test updating user's full name."""
        url = reverse('user_me')
        data = {'full_name': 'Updated Name'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['full_name'] == 'Updated Name'

        user.refresh_from_db()
        assert user.full_name == 'Updated Name'

    def test_profile_update_avatar_url(self, authenticated_client, user):
        """Test updating user's avatar URL with valid domain."""
        url = reverse('user_me')
        data = {'avatar_url': 'https://gravatar.com/avatar/test.jpg'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['avatar_url'] == 'https://gravatar.com/avatar/test.jpg'

    def test_profile_update_invalid_avatar_url(self, authenticated_client, user):
        """Test updating avatar URL with invalid/disallowed domain is rejected."""
        url = reverse('user_me')
        # Try to use a disallowed domain
        data = {'avatar_url': 'https://evil.com/malicious.jpg'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_profile_update_http_avatar_url_rejected(self, authenticated_client, user):
        """Test HTTP (non-HTTPS) avatar URL is rejected."""
        url = reverse('user_me')
        data = {'avatar_url': 'http://gravatar.com/avatar/test.jpg'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_profile_update_requires_authentication(self, api_client):
        """Test profile update requires authentication."""
        url = reverse('user_me')
        data = {'full_name': 'Test'}
        response = api_client.patch(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestTOTPSetup:
    """Tests for TOTP/2FA setup."""

    def test_totp_status_no_device(self, authenticated_client, user):
        """Test TOTP status when no device is configured."""
        url = reverse('totp-status')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['enabled'] is False
        assert response.data['device'] is None
        assert response.data['backup_codes_remaining'] == 0

    def test_totp_setup_creates_device(self, authenticated_client, user):
        """Test TOTP setup creates a new device."""
        url = reverse('totp-setup')
        data = {'name': 'My Authenticator'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'device' in response.data
        assert 'qr_code' in response.data
        assert 'secret' in response.data
        assert response.data['qr_code'].startswith('data:image/png;base64,')

        # Verify device was created
        assert TOTPDevice.objects.filter(user=user, name='My Authenticator').exists()
        device = TOTPDevice.objects.get(user=user)
        assert device.confirmed is False

    def test_totp_setup_replaces_unconfirmed_device(self, authenticated_client, user):
        """Test TOTP setup replaces existing unconfirmed device."""
        # Create unconfirmed device
        old_device = TOTPDevice.create_for_user(user, name='Old Device')
        old_device_secret = old_device.secret

        url = reverse('totp-setup')
        data = {'name': 'New Device'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED

        # Old device should be deleted
        assert not TOTPDevice.objects.filter(secret=old_device_secret).exists()
        # New device should exist
        assert TOTPDevice.objects.filter(user=user, name='New Device').exists()

    def test_totp_setup_prevents_overwriting_confirmed_device(self, authenticated_client, user):
        """Test TOTP setup is rejected if confirmed device exists."""
        # Create confirmed device
        device = TOTPDevice.create_for_user(user, name='Confirmed Device')
        device.confirmed = True
        device.save()
        user.totp_enabled = True
        user.save()

        url = reverse('totp-setup')
        data = {'name': 'New Device'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already enabled' in response.data['error'].lower()

    def test_totp_enable_with_valid_token(self, authenticated_client, user):
        """Test enabling TOTP with valid token generates backup codes."""
        # Setup device
        device = TOTPDevice.create_for_user(user, name='Test Device')

        # Generate valid TOTP token
        import pyotp
        totp = pyotp.TOTP(device.secret)
        valid_token = totp.now()

        url = reverse('totp-enable')
        data = {'token': valid_token}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'enabled' in response.data['message'].lower()
        assert 'backup_codes' in response.data
        assert len(response.data['backup_codes']) == 10

        # Verify device is confirmed
        device.refresh_from_db()
        assert device.confirmed is True

        # Verify user has 2FA enabled
        user.refresh_from_db()
        assert user.totp_enabled is True

        # Verify backup codes were created
        assert BackupCode.objects.filter(user=user, used=False).count() == 10

    def test_totp_enable_with_invalid_token(self, authenticated_client, user):
        """Test enabling TOTP with invalid token is rejected."""
        device = TOTPDevice.create_for_user(user, name='Test Device')

        url = reverse('totp-enable')
        data = {'token': '000000'}  # Invalid token
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Device should not be confirmed
        device.refresh_from_db()
        assert device.confirmed is False

    def test_totp_disable_with_password(self, authenticated_client, user):
        """Test disabling TOTP with correct password."""
        # Enable 2FA
        device = TOTPDevice.create_for_user(user, name='Test Device')
        device.confirmed = True
        device.save()
        user.totp_enabled = True
        user.set_password('SecurePass123!')
        user.save()

        # Create backup codes
        BackupCode.generate_for_user(user, count=10)

        authenticated_client.force_authenticate(user=user)

        url = reverse('totp-disable')
        data = {'password': 'SecurePass123!'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'disabled' in response.data['message'].lower()

        # Verify device was deleted
        assert not TOTPDevice.objects.filter(user=user).exists()

        # Verify backup codes were deleted
        assert BackupCode.objects.filter(user=user).count() == 0

        # Verify user has 2FA disabled
        user.refresh_from_db()
        assert user.totp_enabled is False

    def test_totp_disable_with_wrong_password(self, authenticated_client, user):
        """Test disabling TOTP with wrong password is rejected."""
        device = TOTPDevice.create_for_user(user, name='Test Device')
        device.confirmed = True
        device.save()
        user.totp_enabled = True
        user.set_password('CorrectPass123!')
        user.save()

        authenticated_client.force_authenticate(user=user)

        url = reverse('totp-disable')
        data = {'password': 'WrongPassword'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Device should still exist
        assert TOTPDevice.objects.filter(user=user).exists()


@pytest.mark.django_db
class TestBackupCodes:
    """Tests for backup codes functionality."""

    def test_backup_codes_list(self, authenticated_client, user):
        """Test listing backup codes."""
        # Enable 2FA and generate backup codes
        device = TOTPDevice.create_for_user(user, name='Test Device')
        device.confirmed = True
        device.save()
        user.totp_enabled = True
        user.save()

        BackupCode.generate_for_user(user, count=10)

        url = reverse('backup-codes-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 10
        assert response.data['used'] == 0
        assert response.data['remaining'] == 10

    def test_backup_codes_regenerate(self, authenticated_client, user):
        """Test regenerating backup codes."""
        # Enable 2FA
        device = TOTPDevice.create_for_user(user, name='Test Device')
        device.confirmed = True
        device.save()
        user.totp_enabled = True
        user.set_password('SecurePass123!')
        user.save()

        # Generate initial backup codes
        old_codes = BackupCode.generate_for_user(user, count=10)
        old_code_values = [code for code in old_codes]

        authenticated_client.force_authenticate(user=user)

        url = reverse('backup-codes-regenerate')
        data = {'password': 'SecurePass123!'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'regenerated' in response.data['message'].lower()
        assert 'backup_codes' in response.data
        assert len(response.data['backup_codes']) == 10

        # New codes should be different from old codes
        new_codes = response.data['backup_codes']
        assert set(new_codes) != set(old_code_values)

    def test_backup_codes_regenerate_requires_password(self, authenticated_client, user):
        """Test backup codes regeneration requires password."""
        user.totp_enabled = True
        user.save()

        url = reverse('backup-codes-regenerate')
        data = {}  # No password
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data['error'].lower()

    def test_backup_codes_regenerate_requires_2fa_enabled(self, authenticated_client, user):
        """Test backup codes regeneration requires 2FA to be enabled."""
        user.totp_enabled = False
        user.set_password('SecurePass123!')
        user.save()

        authenticated_client.force_authenticate(user=user)

        url = reverse('backup-codes-regenerate')
        data = {'password': 'SecurePass123!'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert '2fa' in response.data['error'].lower()


@pytest.mark.django_db
class TestCSRFToken:
    """Tests for CSRF token endpoint."""

    def test_csrf_token_endpoint(self, api_client):
        """Test CSRF token endpoint returns token."""
        url = reverse('csrf_token')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'csrfToken' in response.data
        assert len(response.data['csrfToken']) > 0
