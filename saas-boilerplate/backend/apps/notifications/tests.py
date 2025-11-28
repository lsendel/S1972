import pytest
from django.urls import reverse
from rest_framework import status
from apps.notifications.models import Notification

@pytest.mark.django_db
class TestNotificationViewSet:
    def test_list_notifications(self, authenticated_client, user):
        Notification.objects.create(recipient=user, title="Test 1", message="Message 1")
        Notification.objects.create(recipient=user, title="Test 2", message="Message 2")
        
        url = reverse('notification-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_mark_as_read(self, authenticated_client, user):
        notification = Notification.objects.create(recipient=user, title="Test", message="Message")
        
        url = reverse('notification-read', args=[notification.id])
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        notification.refresh_from_db()
        assert notification.is_read is True

    def test_mark_all_as_read(self, authenticated_client, user):
        Notification.objects.create(recipient=user, title="Test 1", message="Message 1")
        Notification.objects.create(recipient=user, title="Test 2", message="Message 2")
        
        url = reverse('notification-read-all')
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.filter(recipient=user, is_read=False).count() == 0
