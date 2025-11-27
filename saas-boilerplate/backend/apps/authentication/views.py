from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.conf import settings
from .serializers import LoginSerializer, SignupSerializer, UserSerializer, PasswordResetSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from .services import TwoFAService
from django_otp.plugins.otp_totp.models import TOTPDevice

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Check for 2FA
        if user.totp_enabled:
            otp_code = request.data.get('otp_code')
            if not otp_code:
                return Response(
                    {"detail": "2FA code required", "code": "2fa_required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not TwoFAService.verify_token(user, otp_code):
                 return Response(
                    {"detail": "Invalid 2FA code", "code": "invalid_2fa"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        login(request, user)
        return Response(UserSerializer(user).data)

class SignupView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = SignupSerializer

    @extend_schema(responses={201: UserSerializer})
    def perform_create(self, serializer):
        user = serializer.save()
        # Auto login after signup?
        # login(self.request, user)
        # Usually better to require verification or explicit login
        return user

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: None})
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class PasswordResetView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    @extend_schema(request=PasswordResetSerializer, responses={200: None})
    def post(self, request):
        # Implement password reset logic (send email)
        # This is a placeholder for the actual logic using django's PasswordResetForm or custom
        return Response({"message": "If account exists, email sent."}, status=status.HTTP_200_OK)

class TwoFASetupView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        device, config_url = TwoFAService.create_totp_device(request.user)
        qr_code = TwoFAService.generate_qr_code(config_url)
        return Response({
            "device_id": device.id,
            "config_url": config_url,
            "qr_code": qr_code # base64 string
        })

class TwoFAVerifyView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(name='device_id', type=int, location=OpenApiParameter.QUERY),
            OpenApiParameter(name='token', type=str, location=OpenApiParameter.QUERY)
        ],
        responses={200: None}
    )
    def post(self, request):
        device_id = request.data.get('device_id')
        token = request.data.get('token')

        if not device_id or not token:
             return Response({"detail": "device_id and token required"}, status=status.HTTP_400_BAD_REQUEST)

        if TwoFAService.confirm_device(request.user, device_id, token):
             return Response({"detail": "2FA enabled successfully"})

        return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
