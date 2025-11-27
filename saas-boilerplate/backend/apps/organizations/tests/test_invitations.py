import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, Membership, Invitation
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.mark.django_db
class TestInvitationFlow:
    def setup_method(self):
        from config.celery import app
        app.conf.update(task_always_eager=True)
        self.client = APIClient()
        self.owner = User.objects.create_user(email="owner@example.com", password="password123", full_name="Owner")
        self.org = Organization.objects.create(name="Test Org", slug="test-org")
        Membership.objects.create(user=self.owner, organization=self.org, role='owner')

        self.client.force_authenticate(user=self.owner)
        self.create_invite_url = reverse('organization-create-invitation', kwargs={'slug': self.org.slug})

    def test_create_invitation(self):
        data = {
            "email": "invitee@example.com",
            "role": "member"
        }
        response = self.client.post(self.create_invite_url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Invitation.objects.count() == 1
        invite = Invitation.objects.first()
        assert invite.email == "invitee@example.com"
        assert invite.status == "pending"
        assert invite.token is not None

    def test_create_invitation_duplicate_member(self):
        # Add user as member first
        member = User.objects.create_user(email="member@example.com", password="password123")
        Membership.objects.create(user=member, organization=self.org, role='member')

        data = {
            "email": "member@example.com",
            "role": "member"
        }
        response = self.client.post(self.create_invite_url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "User is already a member" in str(response.data)

    def test_accept_invitation_existing_user(self):
        # Create invite
        invite = Invitation.objects.create(
            email="existing@example.com",
            organization=self.org,
            role="member",
            token="valid-token",
            expires_at=timezone.now() + timedelta(days=1),
            invited_by=self.owner
        )

        # Create user
        user = User.objects.create_user(email="existing@example.com", password="password123")

        # Authenticate as user
        self.client.force_authenticate(user=user)

        accept_url = reverse('accept-invitation', kwargs={'token': invite.token})
        data = {"token": invite.token}

        response = self.client.post(accept_url, data)
        assert response.status_code == status.HTTP_200_OK

        invite.refresh_from_db()
        assert invite.status == "accepted"
        assert Membership.objects.filter(user=user, organization=self.org).exists()

    def test_accept_invitation_new_user(self):
        # Create invite
        invite = Invitation.objects.create(
            email="new@example.com",
            organization=self.org,
            role="member",
            token="valid-token-new",
            expires_at=timezone.now() + timedelta(days=1),
            invited_by=self.owner
        )

        self.client.logout() # Ensure no one logged in

        accept_url = reverse('accept-invitation', kwargs={'token': invite.token})
        data = {
            "token": invite.token,
            "password": "newpassword123",
            "full_name": "New Member"
        }

        response = self.client.post(accept_url, data)
        assert response.status_code == status.HTTP_200_OK

        invite.refresh_from_db()
        assert invite.status == "accepted"

        user = User.objects.get(email="new@example.com")
        assert Membership.objects.filter(user=user, organization=self.org).exists()

    def test_check_invitation(self):
         invite = Invitation.objects.create(
            email="check@example.com",
            organization=self.org,
            role="member",
            token="check-token",
            expires_at=timezone.now() + timedelta(days=1),
            invited_by=self.owner
        )

         check_url = reverse('check-invitation', kwargs={'token': invite.token})
         self.client.logout()

         response = self.client.get(check_url)
         assert response.status_code == status.HTTP_200_OK
         assert response.data['email'] == "check@example.com"
         assert response.data['organization_name'] == "Test Org"
