"""
API Documentation Settings using drf-spectacular

This configuration provides auto-generated OpenAPI 3.0 documentation
for the REST API endpoints.
"""

SPECTACULAR_SETTINGS = {
    'TITLE': 'SaaS Boilerplate API',
    'DESCRIPTION': '''
    RESTful API for the SaaS Boilerplate Platform

    ## Authentication

    This API uses JWT (JSON Web Tokens) for authentication. To use authenticated endpoints:

    1. Obtain a token by POST to `/api/v1/auth/login/` with your credentials
    2. Include the token in the Authorization header: `Authorization: Bearer <token>`
    3. Refresh tokens when they expire using `/api/v1/auth/refresh/`

    ## Rate Limiting

    - Authentication endpoints: 5 requests/minute
    - General API endpoints: 100 requests/minute (GET), 50 requests/minute (POST)

    ## Pagination

    List endpoints support pagination with the following query parameters:
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20, max: 100)

    ## Filtering & Ordering

    Many list endpoints support filtering and ordering via query parameters.
    See individual endpoint documentation for supported filters.

    ## Error Responses

    The API uses standard HTTP status codes:
    - `200`: Success
    - `201`: Created
    - `204`: No Content (successful deletion)
    - `400`: Bad Request (validation errors)
    - `401`: Unauthorized (missing/invalid token)
    - `403`: Forbidden (insufficient permissions)
    - `404`: Not Found
    - `429`: Too Many Requests (rate limit exceeded)
    - `500`: Internal Server Error

    Error responses include a `detail` field with a description of the error.
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,

    # Schema settings
    'SCHEMA_PATH_PREFIX': r'/api/v1',
    'COMPONENT_SPLIT_REQUEST': True,

    # Authentication
    'SECURITY': [
        {
            'bearerAuth': []
        }
    ],
    'SECURITY_DEFINITIONS': {
        'bearerAuth': {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
        }
    },

    # UI settings
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'filter': True,
        'tryItOutEnabled': True,
        'defaultModelsExpandDepth': 1,
        'defaultModelExpandDepth': 2,
    },

    # ReDoc settings
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
        'expandResponses': '200,201',
        'pathInMiddlePanel': True,
        'nativeScrollbars': True,
        'theme': {
            'colors': {
                'primary': {
                    'main': '#4F46E5',  # Indigo-600
                }
            },
            'typography': {
                'fontSize': '15px',
                'headings': {
                    'fontFamily': 'Inter, sans-serif',
                },
            },
        },
    },

    # Tags for organizing endpoints
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication and registration'},
        {'name': 'Users', 'description': 'User management and profiles'},
        {'name': 'Organizations', 'description': 'Multi-tenant organization management'},
        {'name': 'Teams', 'description': 'Team members and invitations'},
        {'name': 'Subscriptions', 'description': 'Billing and subscription management'},
        {'name': 'Payments', 'description': 'Payment methods and transactions'},
    ],

    # Enum settings
    'ENUM_NAME_OVERRIDES': {
        'ValidationErrorEnum': 'rest_framework.exceptions.ValidationError',
    },

    # Schema preprocessing
    'PREPROCESSING_HOOKS': [
        'apps.api.schema.preprocessing_filter_schema',
    ],

    # Postprocessing hooks for customization
    'POSTPROCESSING_HOOKS': [
        'apps.api.schema.postprocessing_hook',
    ],

    # Sorting
    'SORT_OPERATION_PARAMETERS': True,
    'SORT_OPERATIONS': True,

    # Extensions
    'EXTENSIONS_INFO': {
        'x-logo': {
            'url': '/static/logo.png',
            'altText': 'SaaS Boilerplate',
        }
    },
}
