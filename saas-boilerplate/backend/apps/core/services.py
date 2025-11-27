from django.core.mail import send_mail
from django.conf import settings
from typing import List, Optional

class EmailService:
    @staticmethod
    def send_email(
        subject: str,
        message: str,
        recipient_list: List[str],
        from_email: Optional[str] = None,
        html_message: Optional[str] = None,
        fail_silently: bool = False
    ) -> int:
        """
        Send an email using Django's send_mail wrapper.
        """
        if from_email is None:
            from_email = settings.DEFAULT_FROM_EMAIL

        return send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=fail_silently
        )
