from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django_ratelimit.decorators import ratelimit
from drf_spectacular.utils import extend_schema
from .serializers import LoginSerializer, SignupSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer, VerifyEmailSerializer
from apps.authentication.serializers import PasswordChangeSerializer
from apps.accounts.serializers import UserSerializer, ProfileUpdateSerializer
from apps.accounts.models import User

@method_decorator(ensure_csrf_cookie, name='dispatch')
@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='dispatch')
class LoginView(views.APIView):
    """
    Login endpoint with rate limiting (5 attempts per minute per IP).
    """
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response(None, status=status.HTTP_200_OK)

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(None, status=status.HTTP_200_OK)

@method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=True), name='dispatch')
class SignupView(generics.CreateAPIView):
    """
    Signup endpoint with rate limiting (3 signups per hour per IP).
    """
    permission_classes = [AllowAny]
    serializer_class = SignupSerializer

    def perform_create(self, serializer):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.core.mail import send_mail
        from django.conf import settings

        # Create the user
        user = serializer.save()

        # Generate email verification token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_token = f"{uid}:{token}"

        # Build verification URL
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}/"

        # Send verification email
        subject = 'Verify Your Email Address'
        message = f"""
Hello {user.get_full_name() or 'there'},

Thank you for signing up! Please verify your email address by clicking the link below:

{verify_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The Team
        """

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

@method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True), name='dispatch')
class PasswordResetView(views.APIView):
    """
    Password reset request endpoint with rate limiting (5 per hour per IP).
    """
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.core.mail import send_mail
        from django.conf import settings

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_active=True)

            # Generate password reset token
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Build reset URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            # Send email
            subject = 'Password Reset Request'
            message = f"""
Hello {user.get_full_name()},

You requested a password reset for your account. Click the link below to reset your password:

{reset_url}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

Best regards,
The Team
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            pass

        # Always return success to prevent email enumeration
        return Response({"detail": "Password reset e-mail has been sent."}, status=status.HTTP_200_OK)

@method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True), name='dispatch')
class PasswordResetConfirmView(views.APIView):
    """
    Password reset confirmation endpoint with rate limiting (5 per hour per IP).
    """
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']



        try:
            # Decode user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)

            # Verify token
            token_generator = PasswordResetTokenGenerator()
            if not token_generator.check_token(user, token):
                return Response(
                    {"error": "Invalid or expired reset token."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password
            user.set_password(new_password)
            user.save()

            return Response(
                {"detail": "Password has been reset successfully."},
                status=status.HTTP_200_OK
            )

        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserMeView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(request=ProfileUpdateSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return updated user data
        user_serializer = UserSerializer(request.user)
        return Response(user_serializer.data, status=status.HTTP_200_OK)

class VerifyEmailView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyEmailSerializer

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']

        try:
            # Token format: base64(user_id):token
            if ':' in token:
                uid_b64, token_part = token.split(':', 1)
                user_id = force_str(urlsafe_base64_decode(uid_b64))
            else:
                # Fallback: treat entire token as uid (for compatibility)
                user_id = force_str(urlsafe_base64_decode(token))
                token_part = None

            user = User.objects.get(pk=user_id)

            # If we have a token part, verify it
            if token_part and not default_token_generator.check_token(user, token_part):
                return Response(
                    {"error": "Invalid or expired verification token."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mark email as verified
            if not user.email_verified:
                user.email_verified = True
                user.save(update_fields=['email_verified'])

            return Response(
                {"detail": "Email verified successfully."},
                status=status.HTTP_200_OK
            )

        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid verification link."},
                status=status.HTTP_400_BAD_REQUEST
            )

@method_decorator(ratelimit(key='user', rate='10/h', method='POST', block=True), name='dispatch')
class PasswordChangeView(views.APIView):
    """
    Password change endpoint with rate limiting (10 per hour per user).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PasswordChangeSerializer

    @extend_schema(request=PasswordChangeSerializer, responses={200: None})
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'error': 'Invalid old password.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # This endpoint sets the CSRF cookie and returns the token
        csrf_token = get_token(request)
        return Response({'csrfToken': csrf_token}, status=status.HTTP_200_OK)
