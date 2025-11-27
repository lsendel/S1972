from typing import Tuple, Optional
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp import devices_for_user
import qrcode
import io
import base64

User = get_user_model()

class TwoFAService:
    @staticmethod
    def create_totp_device(user: User, name: str = "default") -> Tuple[TOTPDevice, str]:
        """
        Creates a new TOTP device for the user and returns the device and the provisioning URI.
        """
        # Delete existing unconfirmed devices to keep it clean, or allow multiple?
        # For now, let's assume one active device for simplicity or strictly managed.
        # But standard is to just create one.

        device = TOTPDevice.objects.create(user=user, name=name, confirmed=False)
        return device, device.config_url

    @staticmethod
    def generate_qr_code(config_url: str) -> str:
        """
        Generates a QR code base64 string from the config URL.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(config_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    @staticmethod
    def verify_token(user: User, token: str) -> bool:
        """
        Verifies a TOTP token for a given user against their confirmed devices.
        If the user has unconfirmed devices (e.g. during setup), we might want to check those specifically
        if we pass the device_id, but for login we check all confirmed.
        """
        for device in devices_for_user(user, confirmed=True):
             if device.verify_token(token):
                 return True
        return False

    @staticmethod
    def confirm_device(user: User, device_id: int, token: str) -> bool:
        """
        Verifies a token against a specific device and confirms the device if valid.
        """
        try:
            device = TOTPDevice.objects.get(user=user, id=device_id)
        except TOTPDevice.DoesNotExist:
            return False

        if device.verify_token(token):
            device.confirmed = True
            device.save()
            user.totp_enabled = True
            user.save()
            return True
        return False
