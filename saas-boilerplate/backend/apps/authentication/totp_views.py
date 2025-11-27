from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.core.cache import cache
from apps.accounts.models import TOTPDevice, BackupCode
from .totp_serializers import (
    TOTPDeviceSerializer, TOTPSetupSerializer, TOTPVerifySerializer,
    TOTPEnableSerializer, BackupCodeSerializer, BackupCodeVerifySerializer
)
import qrcode
import qrcode.image.svg
import io
import base64


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def totp_status(request):
    """Get the current 2FA status for the authenticated user."""
    user = request.user
    
    try:
        device = user.totp_device
        serializer = TOTPDeviceSerializer(device)
        backup_codes_count = user.backup_codes.filter(used=False).count()
        
        return Response({
            'enabled': user.totp_enabled and device.confirmed,
            'device': serializer.data if device.confirmed else None,
            'backup_codes_remaining': backup_codes_count
        })
    except TOTPDevice.DoesNotExist:
        return Response({
            'enabled': False,
            'device': None,
            'backup_codes_remaining': 0
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def totp_setup(request):
    """
    Initiate TOTP setup for the user.
    Creates a new TOTP device and returns the provisioning URI and QR code.
    """
    user = request.user
    serializer = TOTPSetupSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete any existing unconfirmed device
    try:
        existing_device = user.totp_device
        if not existing_device.confirmed:
            existing_device.delete()
        else:
            return Response(
                {'error': '2FA is already enabled. Disable it first to set up a new device.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except TOTPDevice.DoesNotExist:
        pass
    
    # Create new device
    device = TOTPDevice.create_for_user(user, name=serializer.validated_data['name'])
    
    # Generate QR code
    provisioning_uri = device.get_provisioning_uri()
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    device_serializer = TOTPDeviceSerializer(device)
    
    return Response({
        'device': device_serializer.data,
        'qr_code': f'data:image/png;base64,{qr_code_base64}',
        'secret': device.secret,  # Show secret for manual entry
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def totp_enable(request):
    """
    Enable TOTP by verifying a token from the new device.
    Generates backup codes upon successful verification.
    """
    user = request.user
    serializer = TOTPEnableSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        device = user.totp_device
    except TOTPDevice.DoesNotExist:
        return Response(
            {'error': 'No TOTP device found. Please set up 2FA first.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if device.confirmed:
        return Response(
            {'error': '2FA is already enabled.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify the token
    token = serializer.validated_data['token']
    if not device.verify_token(token):
        return Response(
            {'error': 'Invalid verification code. Please try again.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Confirm the device and enable TOTP for the user
    device.confirmed = True
    device.save(update_fields=['confirmed'])
    
    user.totp_enabled = True
    user.save(update_fields=['totp_enabled'])
    
    # Generate backup codes
    backup_codes = BackupCode.generate_for_user(user, count=10)
    
    return Response({
        'message': '2FA has been successfully enabled.',
        'backup_codes': backup_codes,
        'warning': 'Save these backup codes in a safe place. They can only be displayed once.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def totp_disable(request):
    """
    Disable TOTP for the user.
    Requires password confirmation for security.
    """
    user = request.user
    password = request.data.get('password')
    
    if not password:
        return Response(
            {'error': 'Password is required to disable 2FA.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(password):
        return Response(
            {'error': 'Invalid password.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        device = user.totp_device
        device.delete()
    except TOTPDevice.DoesNotExist:
        pass
    
    # Delete all backup codes
    user.backup_codes.all().delete()
    
    user.totp_enabled = False
    user.save(update_fields=['totp_enabled'])
    
    return Response({
        'message': '2FA has been successfully disabled.'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_codes_list(request):
    """List backup codes (without revealing the actual codes)."""
    user = request.user
    codes = user.backup_codes.all().order_by('-created_at')
    serializer = BackupCodeSerializer(codes, many=True)
    
    return Response({
        'codes': serializer.data,
        'total': codes.count(),
        'used': codes.filter(used=True).count(),
        'remaining': codes.filter(used=False).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def backup_codes_regenerate(request):
    """
    Regenerate backup codes.
    Requires password confirmation for security.
    """
    user = request.user
    password = request.data.get('password')
    
    if not password:
        return Response(
            {'error': 'Password is required to regenerate backup codes.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(password):
        return Response(
            {'error': 'Invalid password.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.totp_enabled:
        return Response(
            {'error': '2FA must be enabled to regenerate backup codes.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate new backup codes
    backup_codes = BackupCode.generate_for_user(user, count=10)
    
    return Response({
        'message': 'Backup codes have been regenerated.',
        'backup_codes': backup_codes,
        'warning': 'Save these backup codes in a safe place. They can only be displayed once.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def totp_verify_login(request):
    """
    Verify TOTP token or backup code during login.
    Used after successful password authentication.
    """
    # This endpoint would typically be used in the login flow
    # For now, it's a placeholder that would need to be integrated
    # with the session-based auth flow
    
    user_id = cache.get(f'2fa_pending:{request.session.session_key}')
    
    if not user_id:
        return Response(
            {'error': 'No pending 2FA verification.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'Token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Try TOTP verification first
    try:
        device = user.totp_device
        if device.verified and device.verify_token(token):
            # Clear the pending 2FA flag
            cache.delete(f'2fa_pending:{request.session.session_key}')
            # Complete the login (this would integrate with your auth system)
            return Response({'message': '2FA verification successful.'})
    except TOTPDevice.DoesNotExist:
        pass
    
    # Try backup code verification
    for backup_code in user.backup_codes.filter(used=False):
        if backup_code.verify_code(token):
            # Clear the pending 2FA flag
            cache.delete(f'2fa_pending:{request.session.session_key}')
            return Response({
                'message': '2FA verification successful using backup code.',
                'backup_codes_remaining': user.backup_codes.filter(used=False).count()
            })
    
    return Response(
        {'error': 'Invalid verification code or backup code.'},
        status=status.HTTP_400_BAD_REQUEST
    )
