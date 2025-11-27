from django.urls import path
from . import oauth_views

urlpatterns = [
    # OAuth Account Management
    path('oauth/accounts/', oauth_views.oauth_connected_accounts, name='oauth-connected-accounts'),
    path('oauth/providers/', oauth_views.oauth_available_providers, name='oauth-available-providers'),
    path('oauth/authorize/<str:provider>/', oauth_views.oauth_authorization_url, name='oauth-authorize'),
    path('oauth/disconnect/<str:provider>/', oauth_views.oauth_disconnect, name='oauth-disconnect'),
    
    # OAuth Callback
    path('oauth/callback/<str:provider>/', oauth_views.oauth_callback, name='oauth-callback'),
]
