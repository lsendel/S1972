from django.urls import path, include
from .views import LoginView, LogoutView, SignupView, PasswordResetView, PasswordResetConfirmView, UserMeView, VerifyEmailView, CSRFTokenView, PasswordChangeView

urlpatterns = [
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('email/verify/', VerifyEmailView.as_view(), name='verify_email'),
    path('me/', UserMeView.as_view(), name='user_me'),

    # 2FA/TOTP endpoints
    path('', include('apps.authentication.totp_urls')),

    # OAuth endpoints
    path('', include('apps.authentication.oauth_urls')),
]
