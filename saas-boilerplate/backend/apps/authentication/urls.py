from django.urls import path
from .views import LoginView, SignupView, LogoutView, MeView, PasswordResetView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
]
