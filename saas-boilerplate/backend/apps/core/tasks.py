from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

@shared_task
def send_email_task(subject, recipient_list, template_name, context):
    """
    Celery task to send emails asynchronously.
    """
    html_message = render_to_string(template_name, context)

    send_mail(
        subject=subject,
        message="", # Plain text fallback could be generated here
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )
