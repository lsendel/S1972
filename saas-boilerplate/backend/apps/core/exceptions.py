from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Custom exception handler to standardize error responses.

    Args:
        exc: The exception raised.
        context: Context dictionary containing view info.

    Returns:
        Response: Formatted error response.
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the response format
        data = response.data
        errors = []

        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list):
                    for v in value:
                        errors.append({'code': 'VALIDATION_ERROR', 'field': key, 'message': str(v)})
                else:
                    errors.append({'code': 'ERROR', 'field': key, 'message': str(value)})
        elif isinstance(data, list):
            for v in data:
                errors.append({'code': 'ERROR', 'message': str(v)})

        response.data = {
            'data': None,
            'meta': None,
            'errors': errors
        }

    return response
