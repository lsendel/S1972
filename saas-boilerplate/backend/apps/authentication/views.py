from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .serializers import LoginSerializer, SignupSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(views.APIView):
    """View for user login."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        """Handle user login.

        Args:
            request: The request object containing email and password.

        Returns:
            Response: Empty response on success.
        """
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response(None, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    """View for user logout."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle user logout.

        Args:
            request: The request object.

        Returns:
            Response: Empty response on success.
        """
        logout(request)
        return Response(None, status=status.HTTP_200_OK)


class SignupView(generics.CreateAPIView):
    """View for user signup."""

    permission_classes = [AllowAny]
    serializer_class = SignupSerializer


class PasswordResetView(views.APIView):
    """View for initiating password reset."""

    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request):
        """Handle password reset request.

        Args:
            request: The request object containing email.

        Returns:
            Response: Success message.
        """
        # Logic to send password reset email would go here
        return Response({"detail": "Password reset e-mail has been sent."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(views.APIView):
    """View for confirming password reset."""

    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        """Handle password reset confirmation.

        Args:
            request: The request object containing token, uid, and new password.

        Returns:
            Response: Success message.
        """
        # Logic to confirm password reset would go here
        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)


class UserMeView(views.APIView):
    """View for retrieving current user details."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user details.

        Args:
            request: The request object.

        Returns:
            Response: User data.
        """
        from apps.accounts.serializers import UserSerializer
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
