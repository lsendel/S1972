"""
Schema customization hooks for drf-spectacular

These hooks allow customization of the OpenAPI schema generation.
"""


def preprocessing_filter_schema(endpoints):
    """
    Filter out endpoints from the schema based on certain criteria.

    For example, you might want to hide admin or internal endpoints
    from the public API documentation.
    """
    # Filter out Django admin URLs
    filtered = []
    for (path, path_regex, method, callback) in endpoints:
        # Skip admin URLs
        if path.startswith('/admin'):
            continue
        # Skip internal endpoints
        if path.startswith('/_'):
            continue
        filtered.append((path, path_regex, method, callback))

    return filtered


def postprocessing_hook(result, generator, request, public):
    """
    Post-process the generated schema.

    This allows you to modify the schema after it's been generated,
    for example to add custom extensions or modify descriptions.
    """
    # Add custom info
    result['info']['contact'] = {
        'name': 'API Support',
        'email': 'api@yourdomain.com',
        'url': 'https://yourdomain.com/support',
    }

    result['info']['license'] = {
        'name': 'Proprietary',
        'url': 'https://yourdomain.com/license',
    }

    # Add servers
    result['servers'] = [
        {
            'url': 'https://api.yourdomain.com',
            'description': 'Production server',
        },
        {
            'url': 'https://api-staging.yourdomain.com',
            'description': 'Staging server',
        },
        {
            'url': 'http://localhost:8000',
            'description': 'Local development server',
        },
    ]

    return result


def custom_exception_handler(exc, context):
    """
    Custom exception handler for consistent error responses.
    """
    from rest_framework.views import exception_handler
    from rest_framework.response import Response

    # Call DRF's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize error response format
        custom_response_data = {
            'error': {
                'code': response.status_code,
                'message': response.data.get('detail', 'An error occurred'),
                'errors': response.data if isinstance(response.data, dict) else None,
            }
        }
        response.data = custom_response_data

    return response
