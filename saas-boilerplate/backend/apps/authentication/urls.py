from django.urls import path
from .views import LoginView, SignupView, LogoutView, MeView, PasswordResetView, TwoFASetupView, TwoFAVerifyView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('2fa/setup/', TwoFASetupView.as_view(), name='2fa_setup'),
    path('2fa/verify/', TwoFAVerifyView.as_view(), name='2fa_verify'),
]
