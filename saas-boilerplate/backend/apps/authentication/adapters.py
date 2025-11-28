from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Custom adapter for handling social account logins."""

    def pre_social_login(self, request, sociallogin):
        """Invoke just after a user successfully authenticates via a social provider.

        This happens before the login is actually processed.

        Args:
            request: The request object.
            sociallogin: The social login instance.
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
