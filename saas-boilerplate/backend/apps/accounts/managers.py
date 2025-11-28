from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Custom user model manager where email is the unique identifier.

    This manager replaces the default user manager to support email-based
    authentication instead of username-based authentication.
    """

    def create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password.

        Args:
            email: The email address of the user.
            password: The password for the user.
            **extra_fields: Additional fields for the User model.

        Returns:
            User: The created User instance.

        Raises:
            ValueError: If the email is not set.
        """
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password.

        Args:
            email: The email address of the superuser.
            password: The password for the superuser.
            **extra_fields: Additional fields for the User model.

        Returns:
            User: The created SuperUser instance.

        Raises:
            ValueError: If is_staff or is_superuser is not True.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)
