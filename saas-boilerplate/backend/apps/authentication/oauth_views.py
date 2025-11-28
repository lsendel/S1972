from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from allauth.socialaccount.models import SocialAccount
from django.conf import settings
from .oauth_serializers import SocialAccountSerializer, OAuthProviderSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_connected_accounts(request):
    """List all connected OAuth accounts for the current user.

    Args:
        request: The request object.

    Returns:
        Response: List of connected accounts.
    """
    accounts = SocialAccount.objects.filter(user=request.user)
    serializer = SocialAccountSerializer(accounts, many=True)

    return Response({
        'accounts': serializer.data,
        'total': accounts.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_available_providers(request):
    """List all available OAuth providers and their connection status.

    Args:
        request: The request object.

    Returns:
        Response: List of available providers.
    """
    user = request.user
    connected_providers = set(
        SocialAccount.objects.filter(user=user).values_list('provider', flat=True)
    )

    providers = []

    # Google
    if settings.SOCIALACCOUNT_PROVIDERS.get('google', {}).get('APP', {}).get('client_id'):
        providers.append({
            'provider': 'google',
            'name': 'Google',
            'connected': 'google' in connected_providers,
        })

    # GitHub
    if settings.SOCIALACCOUNT_PROVIDERS.get('github', {}).get('APP', {}).get('client_id'):
        providers.append({
            'provider': 'github',
            'name': 'GitHub',
            'connected': 'github' in connected_providers,
        })

    serializer = OAuthProviderSerializer(providers, many=True)
    return Response({'providers': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_authorization_url(request, provider):
    """Get the OAuth authorization URL for a specific provider.

    The frontend should redirect the user to this URL to initiate OAuth flow.

    Args:
        request: The request object.
        provider: The provider name (e.g., 'google', 'github').

    Returns:
        Response: Authorization URL and callback URL.
    """
    if provider not in ['google', 'github']:
        return Response(
            {'error': 'Unsupported provider'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if provider is configured
    provider_config = settings.SOCIALACCOUNT_PROVIDERS.get(provider, {})
    if not provider_config.get('APP', {}).get('client_id'):
        return Response(
            {'error': f'{provider.title()} is not configured'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get the callback URL
    callback_url = request.build_absolute_uri(f'/api/auth/oauth/callback/{provider}/')

    # Build authorization URL
    client_id = provider_config['APP']['client_id']

    if provider == 'google':
        auth_url = (
            'https://accounts.google.com/o/oauth2/v2/auth'
            f'?client_id={client_id}'
            f'&redirect_uri={callback_url}'
            '&response_type=code'
            '&scope=openid%20email%20profile'
            '&access_type=online'
        )
    elif provider == 'github':
        auth_url = (
            'https://github.com/login/oauth/authorize'
            f'?client_id={client_id}'
            f'&redirect_uri={callback_url}'
            '&scope=user:email'
        )

    return Response({
        'authorization_url': auth_url,
        'callback_url': callback_url
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def oauth_disconnect(request, provider):
    """Disconnect an OAuth account from the user's profile.

    Args:
        request: The request object.
        provider: The provider name to disconnect.

    Returns:
        Response: Success message or error.
    """
    user = request.user

    try:
        account = SocialAccount.objects.get(user=user, provider=provider)
    except SocialAccount.DoesNotExist:
        return Response(
            {'error': f'No {provider} account connected'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user has a password or other login methods
    # Don't allow disconnecting the only login method
    has_password = user.has_usable_password()
    other_social_accounts = SocialAccount.objects.filter(user=user).exclude(id=account.id).count()

    if not has_password and other_social_accounts == 0:
        return Response(
            {'error': 'Cannot disconnect your only login method. Set a password first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    account.delete()

    return Response({
        'message': f'{provider.title()} account disconnected successfully'
    })


@api_view(['GET'])
def oauth_callback(request, provider):
    """OAuth callback endpoint.

    This is called by the OAuth provider after user authorization.

    Note: This is a placeholder. In a real implementation, you would use
    allauth's built-in callback handling or implement your own token exchange.

    Args:
        request: The request object.
        provider: The provider name.

    Returns:
        Response: Callback received message.
    """
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        return Response(
            {'error': f'OAuth error: {error}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not code:
        return Response(
            {'error': 'No authorization code received'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # In a real implementation, you would:
    # 1. Exchange the code for an access token
    # 2. Use the access token to get user information
    # 3. Create or link a SocialAccount
    # 4. Log the user in
    # 5. Redirect to the frontend

    # For now, return a message indicating the callback was received
    return Response({
        'message': 'OAuth callback received',
        'provider': provider,
        'code': code[:10] + '...',  # Show partial code for debugging
        'note': 'This endpoint needs to be fully implemented with token exchange'
    })
