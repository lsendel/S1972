from django.conf import settings
from .tasks import send_email_task

class EmailService:
    @staticmethod
    def send_verification_email(user, token):
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
        context = {
            'user': {'full_name': user.full_name},
            'verification_url': verification_url
        }
        send_email_task.delay(
            subject="Verify your email",
            recipient_list=[user.email],
            template_name="emails/verify_email.html",
            context=context
        )

    @staticmethod
    def send_password_reset_email(user, token):
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
        context = {
            'user': {'full_name': user.full_name},
            'reset_url': reset_url
        }
        send_email_task.delay(
            subject="Reset your password",
            recipient_list=[user.email],
            template_name="emails/password_reset.html",
            context=context
        )
