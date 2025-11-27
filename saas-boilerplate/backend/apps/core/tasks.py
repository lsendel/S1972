from celery import shared_task
from typing import List, Optional
from .services import EmailService
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(
    subject: str,
    message: str,
    recipient_list: List[str],
    from_email: Optional[str] = None,
    html_message: Optional[str] = None,
    fail_silently: bool = False
):
    try:
        EmailService.send_email(
            subject=subject,
            message=message,
            recipient_list=recipient_list,
            from_email=from_email,
            html_message=html_message,
            fail_silently=fail_silently
        )
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_list}: {e}")
        raise e
