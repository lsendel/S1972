"""
Security Middleware

Adds additional security headers to all responses.
"""


class SecurityHeadersMiddleware:
    """
    Adds security headers to all HTTP responses.

    Headers added:
    - Content-Security-Policy: Prevents XSS and data injection attacks
    - Permissions-Policy: Controls browser features
    - X-Download-Options: Prevents IE from executing downloads
    - X-DNS-Prefetch-Control: Controls DNS prefetching
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content Security Policy
        # Adjust directives based on your needs
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Adjust for your frontend needs
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.stripe.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)

        # Permissions Policy (formerly Feature Policy)
        # Disable unnecessary browser features
        permissions_policy = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=(self)",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
        ]
        response['Permissions-Policy'] = ', '.join(permissions_policy)

        # Prevent IE from executing downloads in site's context
        response['X-Download-Options'] = 'noopen'

        # Control DNS prefetching
        response['X-DNS-Prefetch-Control'] = 'off'

        # Prevent MIME type sniffing (already in Django settings, but explicit here)
        response['X-Content-Type-Options'] = 'nosniff'

        return response


class RateLimitHeadersMiddleware:
    """
    Adds rate limit information to responses.

    Works with Django Ratelimit or similar packages.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add rate limit headers if rate limiting is enabled
        if hasattr(request, 'limited'):
            response['X-RateLimit-Limit'] = getattr(request, 'ratelimit_limit', '')
            response['X-RateLimit-Remaining'] = getattr(request, 'ratelimit_remaining', '')
            response['X-RateLimit-Reset'] = getattr(request, 'ratelimit_reset', '')

        return response


class SecureReferrerMiddleware:
    """
    Controls referrer information sent with requests.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Strict referrer policy for better privacy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        return response
