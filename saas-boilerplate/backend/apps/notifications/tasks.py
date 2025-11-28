from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

@shared_task
def send_notification(user_id, title, message, level='info', data=None, send_email=False):
    try:
        user = User.objects.get(id=user_id)
        
        # Create in-app notification
        Notification.objects.create(
            recipient=user,
            title=title,
            message=message,
            level=level,
            data=data or {}
        )

        # Send email if requested
        if send_email and user.email:
            send_mail(
                subject=title,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            
        return f"Notification sent to user {user_id}"
    except User.DoesNotExist:
        return f"User {user_id} not found"
