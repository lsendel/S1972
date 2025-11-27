from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(subject, recipient_list, template_name, context):
    """
    Async task to send HTML emails.
    """
    try:
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email '{subject}' sent to {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {recipient_list}: {e}")
        raise e

@shared_task
def debug_periodic_task():
    logger.info("Periodic task executed successfully.")
