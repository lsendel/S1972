"""Schema customization hooks for drf-spectacular.

These hooks allow customization of the OpenAPI schema generation.
"""


def preprocessing_filter_schema(endpoints):
    """Filter out endpoints from the schema based on certain criteria.

    For example, hiding admin or internal endpoints from the public
    API documentation.

    Args:
        endpoints: List of (path, path_regex, method, callback) tuples.

    Returns:
        list: Filtered list of endpoints.
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
    """Post-process the generated schema.

    Allows modification of the schema after generation, such as adding
    custom extensions or modifying descriptions.

    Args:
        result: The generated schema dictionary.
        generator: The SchemaGenerator instance.
        request: The request object.
        public: Boolean indicating if schema is public.

    Returns:
        dict: The modified schema.
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
    """Custom exception handler for consistent error responses.

    Args:
        exc: The exception raised.
        context: Context dictionary containing view info.

    Returns:
        Response: formatted error response or None.
    """
    from rest_framework.views import exception_handler

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
