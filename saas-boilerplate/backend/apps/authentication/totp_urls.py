from django.urls import path
from . import totp_views

urlpatterns = [
    # 2FA Status and Setup
    path('2fa/status/', totp_views.totp_status, name='totp-status'),
    path('2fa/setup/', totp_views.totp_setup, name='totp-setup'),
    path('2fa/enable/', totp_views.totp_enable, name='totp-enable'),
    path('2fa/disable/', totp_views.totp_disable, name='totp-disable'),
    
    # Backup Codes
    path('2fa/backup-codes/', totp_views.backup_codes_list, name='backup-codes-list'),
    path('2fa/backup-codes/regenerate/', totp_views.backup_codes_regenerate, name='backup-codes-regenerate'),
    
    # Login Verification
    path('2fa/verify/', totp_views.totp_verify_login, name='totp-verify-login'),
]
