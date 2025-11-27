from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.utils import user_email, user_field
from django.utils import timezone


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social account authentication.
    Handles user creation and updates for OAuth providers.
    """

    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a social provider,
        but before the login is actually processed.
        
        This is used to link social accounts to existing users based on email.
        """
        # If the user is already logged in, link the account
        if request.user.is_authenticated:
            return

        # Try to find existing user by email
        if sociallogin.is_existing:
            return

        try:
            email = sociallogin.account.extra_data.get('email')
            if not email:
                return

            from apps.accounts.models import User
            existing_user = User.objects.get(email=email)

            # Link the social account to the existing user
            sociallogin.connect(request, existing_user)
        except User.DoesNotExist:
            pass

    def populate_user(self, request, sociallogin, data):
        """
        Populate user information from social provider data.
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Set email as verified since it's confirmed by the OAuth provider
        user.email_verified = True
        
        # Try to get full name from different providers
        if not user.full_name:
            provider = sociallogin.account.provider
            extra_data = sociallogin.account.extra_data

            if provider == 'google':
                user.full_name = extra_data.get('name', '')
                user.avatar_url = extra_data.get('picture', '')
            elif provider == 'github':
                user.full_name = extra_data.get('name', '')
                user.avatar_url = extra_data.get('avatar_url', '')

        return user

    def save_user(self, request, user, form=None):
        """
        Save user with additional tracking information.
        """
        user = super().save_user(request, user, form)
        
        # Track login information
        user.last_login_at = timezone.now()
        if hasattr(request, 'META'):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                user.last_login_ip = x_forwarded_for.split(',')[0]
            else:
                user.last_login_ip = request.META.get('REMOTE_ADDR')
        
        user.save()
        return user
