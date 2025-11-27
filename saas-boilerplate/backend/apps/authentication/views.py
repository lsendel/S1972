from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .serializers import LoginSerializer, SignupSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer

@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(views.APIView):
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

class SignupView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = SignupSerializer

class PasswordResetView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request):
        # Logic to send password reset email would go here
        return Response({"detail": "Password reset e-mail has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        # Logic to confirm password reset would go here
        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)

class UserMeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.accounts.serializers import UserSerializer
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
