from django.urls import path, include
from .views import LoginView, LogoutView, SignupView, PasswordResetView, PasswordResetConfirmView, UserMeView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('me/', UserMeView.as_view(), name='user_me'),

    # 2FA/TOTP endpoints
    path('', include('apps.authentication.totp_urls')),
]
