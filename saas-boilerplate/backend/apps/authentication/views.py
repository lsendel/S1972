from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from .serializers import LoginSerializer, SignupSerializer, UserSerializer, PasswordResetSerializer
from drf_spectacular.utils import extend_schema

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "CSRF cookie set"})

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
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
