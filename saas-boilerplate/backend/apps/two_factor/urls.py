from django.urls import path
from . import views

urlpatterns = [
    path('totp/status/', views.totp_status, name='totp-status'),
    path('totp/setup/', views.totp_setup, name='totp-setup'),
    path('totp/enable/', views.totp_enable, name='totp-enable'),
    path('totp/disable/', views.totp_disable, name='totp-disable'),
    path('totp/verify-login/', views.totp_verify_login, name='totp-verify-login'),
    path('backup-codes/', views.backup_codes_list, name='backup-codes-list'),
    path('backup-codes/regenerate/', views.backup_codes_regenerate, name='backup-codes-regenerate'),
]
