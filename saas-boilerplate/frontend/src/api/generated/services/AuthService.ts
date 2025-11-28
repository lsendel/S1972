/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackupCode } from '../models/BackupCode';
import type { Login } from '../models/Login';
import type { LoginRequest } from '../models/LoginRequest';
import type { OAuthAuthorizationUrl } from '../models/OAuthAuthorizationUrl';
import type { OAuthCallback } from '../models/OAuthCallback';
import type { OAuthProviderList } from '../models/OAuthProviderList';
import type { PasswordChangeRequest } from '../models/PasswordChangeRequest';
import type { PasswordConfirmationRequest } from '../models/PasswordConfirmationRequest';
import type { PasswordReset } from '../models/PasswordReset';
import type { PasswordResetConfirm } from '../models/PasswordResetConfirm';
import type { PasswordResetConfirmRequest } from '../models/PasswordResetConfirmRequest';
import type { PasswordResetRequest } from '../models/PasswordResetRequest';
import type { Signup } from '../models/Signup';
import type { SignupRequest } from '../models/SignupRequest';
import type { SocialAccountList } from '../models/SocialAccountList';
import type { TOTPDevice } from '../models/TOTPDevice';
import type { TOTPEnableRequest } from '../models/TOTPEnableRequest';
import type { TOTPSetupRequest } from '../models/TOTPSetupRequest';
import type { VerifyEmail } from '../models/VerifyEmail';
import type { VerifyEmailRequest } from '../models/VerifyEmailRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List backup codes (without revealing the actual codes).
     * @returns BackupCode
     * @throws ApiError
     */
    public auth2FaBackupCodesList(): CancelablePromise<Array<BackupCode>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/2fa/backup-codes/',
        });
    }
    /**
     * Regenerate backup codes.
     * Requires password confirmation for security.
     * @returns any No response body
     * @throws ApiError
     */
    public auth2FaBackupCodesRegenerateCreate({
        requestBody,
    }: {
        requestBody: PasswordConfirmationRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/2fa/backup-codes/regenerate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Disable TOTP for the user.
     * Requires password confirmation for security.
     * @returns any No response body
     * @throws ApiError
     */
    public auth2FaDisableCreate({
        requestBody,
    }: {
        requestBody: PasswordConfirmationRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/2fa/disable/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Enable TOTP by verifying a token from the new device.
     * Generates backup codes upon successful verification.
     * @returns any No response body
     * @throws ApiError
     */
    public auth2FaEnableCreate({
        requestBody,
    }: {
        requestBody: TOTPEnableRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/2fa/enable/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Initiate TOTP setup for the user.
     * Creates a new TOTP device and returns the provisioning URI and QR code.
     * @returns TOTPDevice
     * @throws ApiError
     */
    public auth2FaSetupCreate({
        requestBody,
    }: {
        requestBody?: TOTPSetupRequest,
    }): CancelablePromise<TOTPDevice> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/2fa/setup/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get the current 2FA status for the authenticated user.
     * @returns TOTPDevice
     * @throws ApiError
     */
    public auth2FaStatusRetrieve(): CancelablePromise<TOTPDevice> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/2fa/status/',
        });
    }
    /**
     * Verify TOTP token or backup code during login.
     * Used after successful password authentication.
     * @returns any No response body
     * @throws ApiError
     */
    public auth2FaVerifyCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/2fa/verify/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public authCsrfRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/csrf/',
        });
    }
    /**
     * @returns VerifyEmail
     * @throws ApiError
     */
    public authEmailVerifyCreate({
        requestBody,
    }: {
        requestBody: VerifyEmailRequest,
    }): CancelablePromise<VerifyEmail> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/email/verify/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Login
     * @throws ApiError
     */
    public authLoginCreate({
        requestBody,
    }: {
        requestBody: LoginRequest,
    }): CancelablePromise<Login> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/login/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public authLogoutCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/logout/',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public authMeRetrieve(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/me/',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public authMePartialUpdate({
        requestBody,
    }: {
        requestBody?: Record<string, any>,
    }): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/v1/auth/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List all connected OAuth accounts for the current user.
     * @returns SocialAccountList
     * @throws ApiError
     */
    public authOauthAccountsRetrieve(): CancelablePromise<SocialAccountList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/oauth/accounts/',
        });
    }
    /**
     * Get the OAuth authorization URL for a specific provider.
     * The frontend should redirect the user to this URL to initiate OAuth flow.
     * @returns OAuthAuthorizationUrl
     * @throws ApiError
     */
    public authOauthAuthorizeRetrieve({
        provider,
    }: {
        provider: string,
    }): CancelablePromise<OAuthAuthorizationUrl> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/oauth/authorize/{provider}/',
            path: {
                'provider': provider,
            },
        });
    }
    /**
     * OAuth callback endpoint.
     * This is called by the OAuth provider after user authorization.
     *
     * Note: This is a placeholder. In a real implementation, you would use
     * allauth's built-in callback handling or implement your own token exchange.
     * @returns OAuthCallback
     * @throws ApiError
     */
    public authOauthCallbackRetrieve({
        provider,
    }: {
        provider: string,
    }): CancelablePromise<OAuthCallback> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/oauth/callback/{provider}/',
            path: {
                'provider': provider,
            },
        });
    }
    /**
     * Disconnect an OAuth account from the user's profile.
     * @returns any No response body
     * @throws ApiError
     */
    public authOauthDisconnectCreate({
        provider,
    }: {
        provider: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/oauth/disconnect/{provider}/',
            path: {
                'provider': provider,
            },
        });
    }
    /**
     * List all available OAuth providers and their connection status.
     * @returns OAuthProviderList
     * @throws ApiError
     */
    public authOauthProvidersRetrieve(): CancelablePromise<OAuthProviderList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/auth/oauth/providers/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public authPasswordChangeCreate({
        requestBody,
    }: {
        requestBody: PasswordChangeRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/password/change/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PasswordReset
     * @throws ApiError
     */
    public authPasswordResetCreate({
        requestBody,
    }: {
        requestBody: PasswordResetRequest,
    }): CancelablePromise<PasswordReset> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/password/reset/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PasswordResetConfirm
     * @throws ApiError
     */
    public authPasswordResetConfirmCreate({
        requestBody,
    }: {
        requestBody: PasswordResetConfirmRequest,
    }): CancelablePromise<PasswordResetConfirm> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/password/reset/confirm/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Signup
     * @throws ApiError
     */
    public authSignupCreate({
        requestBody,
    }: {
        requestBody: SignupRequest,
    }): CancelablePromise<Signup> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/signup/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
