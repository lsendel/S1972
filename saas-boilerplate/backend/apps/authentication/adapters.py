from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.utils import perform_login
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status

User = get_user_model()

class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a
        social provider, but before the login is actually processed.
        """
        # Ignore existing social accounts, just check if email exists in our system
        if sociallogin.is_existing:
            return

        # Check if user with this email already exists
        email = sociallogin.account.extra_data.get('email')
        if not email:
            return

        try:
            user = User.objects.get(email=email)
            # If user exists, connect this social account to the existing user
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            # If user does not exist, let allauth handle the creation
            pass
