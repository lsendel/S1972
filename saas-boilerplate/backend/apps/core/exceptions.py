from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None:
        data = response.data

        # Format errors into a standard structure
        formatted_errors = []

        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list):
                    for v in value:
                        formatted_errors.append({
                            "code": "VALIDATION_ERROR",
                            "field": key,
                            "message": str(v)
                        })
                else:
                     formatted_errors.append({
                        "code": "ERROR",
                        "field": key,
                        "message": str(value)
                    })
        elif isinstance(data, list):
            for v in data:
                formatted_errors.append({
                    "code": "ERROR",
                    "field": None,
                    "message": str(v)
                })

        response.data = {
            "data": None,
            "meta": None,
            "errors": formatted_errors
        }

    return response
