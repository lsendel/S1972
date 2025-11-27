import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice
from apps.authentication.services import TwoFAService

User = get_user_model()

@pytest.mark.django_db
class TestTwoFAFlow:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="2fa@example.com", password="password123")
        self.login_url = reverse('login')
        self.setup_url = reverse('2fa_setup')
        self.verify_url = reverse('2fa_verify')

    def test_2fa_setup_flow(self):
        self.client.force_authenticate(user=self.user)

        # 1. Generate Setup
        response = self.client.post(self.setup_url)
        assert response.status_code == status.HTTP_200_OK
        assert 'device_id' in response.data
        assert 'config_url' in response.data
        assert 'qr_code' in response.data

        device_id = response.data['device_id']
        device = TOTPDevice.objects.get(id=device_id)
        assert not device.confirmed

        # 2. Verify (Enable)
        # We need to generate a valid token for this device.
        # Since we can't easily sync time and generate a real TOTP in test without exact seed access (which is hidden in device)
        # We can cheat by using device.generate_token() if we were in a shell, but here we can mock or just inspect device.bin_key

        import pyotp
        import base64
        secret_b32 = base64.b32encode(device.bin_key).decode('utf-8')
        totp = pyotp.TOTP(secret_b32)
        token = totp.now()

        verify_data = {
            'device_id': device_id,
            'token': token
        }

        response = self.client.post(self.verify_url, verify_data)
        assert response.status_code == status.HTTP_200_OK

        device.refresh_from_db()
        assert device.confirmed
        self.user.refresh_from_db()
        assert self.user.totp_enabled

    def test_login_with_2fa_enabled(self):
        # Enable 2FA for user manually
        device = TOTPDevice.objects.create(user=self.user, confirmed=True, tolerance=2)
        self.user.totp_enabled = True
        self.user.save()

        # 1. Try login without code
        data = {
            "email": "2fa@example.com",
            "password": "password123"
        }
        response = self.client.post(self.login_url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data['code'] == '2fa_required'

        # 2. Try login with invalid code
        data['otp_code'] = '123456'
        response = self.client.post(self.login_url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # 3. Try login with valid code
        # Create a fresh device to avoid any side effects from previous failed attempts
        device.delete()
        device = TOTPDevice.objects.create(user=self.user, confirmed=True, tolerance=2)

        import pyotp
        import base64
        secret_b32 = base64.b32encode(device.bin_key).decode('utf-8')
        totp = pyotp.TOTP(secret_b32)
        code = totp.now()
        data['otp_code'] = code

        response = self.client.post(self.login_url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == self.user.email
