# API Documentation Guide

This guide covers the API documentation system for the SaaS Boilerplate platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Accessing Documentation](#accessing-documentation)
3. [Authentication](#authentication)
4. [Using the API](#using-the-api)
5. [Available Endpoints](#available-endpoints)
6. [Schema Generation](#schema-generation)
7. [Customizing Documentation](#customizing-documentation)
8. [Best Practices](#best-practices)

---

## Overview

The API documentation is auto-generated using **drf-spectacular**, which produces OpenAPI 3.0 compliant schemas.

### Features

- **Interactive API Explorer** - Test endpoints directly in the browser
- **Auto-generated from Code** - Always in sync with implementation
- **Multiple UI Options** - Swagger UI and ReDoc interfaces
- **Authentication Support** - Test authenticated endpoints
- **Schema Export** - Download OpenAPI schema in JSON/YAML

---

## Accessing Documentation

### Development

When running locally:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Production

- **Swagger UI**: https://api.yourdomain.com/api/docs/
- **ReDoc**: https://api.yourdomain.com/api/redoc/
- **OpenAPI Schema**: https://api.yourdomain.com/api/schema/

### UI Comparison

**Swagger UI:**
- Interactive API testing
- Try out requests in browser
- Great for developers testing endpoints
- Schema visualization

**ReDoc:**
- Clean, organized documentation
- Better for reading/reference
- Printable documentation
- Three-column layout

---

## Authentication

### Testing Authenticated Endpoints

1. **Obtain Token**
   - Navigate to Swagger UI
   - Expand `POST /api/v1/auth/login/`
   - Click "Try it out"
   - Enter credentials and execute
   - Copy the `access_token` from response

2. **Authorize**
   - Click "Authorize" button (top right)
   - Enter: `Bearer <your-access-token>`
   - Click "Authorize"
   - Close dialog

3. **Test Endpoints**
   - Now all authenticated endpoints will include your token
   - Try out protected endpoints

### API Authentication Flow

```bash
# 1. Login to get token
curl -X POST https://api.yourdomain.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}'

# Response:
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "user": {...}
# }

# 2. Use token in requests
curl https://api.yourdomain.com/api/v1/users/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."

# 3. Refresh token when expired
curl -X POST https://api.yourdomain.com/api/v1/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."}'
```

---

## Using the API

### Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://api.yourdomain.com/api/v1`

### Request Format

All requests should:
- Use `Content-Type: application/json` for POST/PUT/PATCH
- Include `Authorization: Bearer <token>` for authenticated endpoints
- Follow RESTful conventions

### Response Format

**Success Response:**
```json
{
  "id": 1,
  "name": "Example",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Response:**
```json
{
  "error": {
    "code": 400,
    "message": "Validation error",
    "errors": {
      "email": ["This field is required"],
      "password": ["Password too short"]
    }
  }
}
```

### Pagination

List endpoints return paginated responses:

```json
{
  "count": 100,
  "next": "https://api.yourdomain.com/api/v1/users/?page=2",
  "previous": null,
  "results": [...]
}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

### Filtering

Many endpoints support filtering:

```bash
# Filter by status
GET /api/v1/organizations/?status=active

# Filter by date range
GET /api/v1/subscriptions/?created_after=2024-01-01

# Search
GET /api/v1/users/?search=john
```

### Ordering

Control result ordering:

```bash
# Ascending
GET /api/v1/organizations/?ordering=name

# Descending
GET /api/v1/organizations/?ordering=-created_at

# Multiple fields
GET /api/v1/users/?ordering=-is_active,name
```

---

## Available Endpoints

### Authentication

```
POST   /api/v1/auth/register/          Register new user
POST   /api/v1/auth/login/             Login and get token
POST   /api/v1/auth/refresh/           Refresh access token
POST   /api/v1/auth/logout/            Logout (invalidate token)
POST   /api/v1/auth/password-reset/    Request password reset
POST   /api/v1/auth/password-change/   Change password
GET    /api/v1/auth/verify-email/      Verify email address
```

### Users

```
GET    /api/v1/users/                  List users
POST   /api/v1/users/                  Create user
GET    /api/v1/users/{id}/             Get user details
PATCH  /api/v1/users/{id}/             Update user
DELETE /api/v1/users/{id}/             Delete user
GET    /api/v1/users/me/               Get current user
PATCH  /api/v1/users/me/               Update current user
```

### Organizations

```
GET    /api/v1/organizations/                List organizations
POST   /api/v1/organizations/                Create organization
GET    /api/v1/organizations/{slug}/         Get organization
PATCH  /api/v1/organizations/{slug}/         Update organization
DELETE /api/v1/organizations/{slug}/         Delete organization
GET    /api/v1/organizations/{slug}/members/ List members
POST   /api/v1/organizations/{slug}/members/ Invite member
DELETE /api/v1/organizations/{slug}/members/{id}/ Remove member
```

### Subscriptions

```
GET    /api/v1/subscriptions/               List subscriptions
POST   /api/v1/subscriptions/               Create subscription
GET    /api/v1/subscriptions/{id}/          Get subscription
PATCH  /api/v1/subscriptions/{id}/          Update subscription
DELETE /api/v1/subscriptions/{id}/          Cancel subscription
POST   /api/v1/subscriptions/{id}/upgrade/  Upgrade plan
```

---

## Schema Generation

### Export Schema

**JSON Format:**
```bash
curl https://api.yourdomain.com/api/schema/ > openapi.json
```

**YAML Format:**
```bash
curl https://api.yourdomain.com/api/schema/?format=yaml > openapi.yaml
```

### Generate Client SDKs

Use the OpenAPI schema to generate client libraries:

**JavaScript/TypeScript:**
```bash
npx openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-fetch \
  -o ./src/api/client
```

**Python:**
```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g python \
  -o ./api-client
```

**Other Languages:**
- Java
- Ruby
- Go
- PHP
- Swift
- Kotlin
- And more...

See [OpenAPI Generator](https://openapi-generator.tech/) for all options.

---

## Customizing Documentation

### Documenting Endpoints

Use decorators to add documentation:

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from rest_framework import viewsets

class UserViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Get user details",
        description="Retrieve detailed information about a specific user.",
        tags=["Users"],
        parameters=[
            OpenApiParameter(
                name='include_inactive',
                type=bool,
                location=OpenApiParameter.QUERY,
                description='Include inactive users',
                required=False,
            ),
        ],
        examples=[
            OpenApiExample(
                'User Example',
                value={
                    'id': 1,
                    'email': 'user@example.com',
                    'full_name': 'John Doe',
                    'is_active': True,
                },
                request_only=False,
                response_only=True,
            ),
        ],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
```

### Custom Responses

```python
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Valid example',
            summary='Valid user registration',
            value={
                'email': 'user@example.com',
                'password': 'SecurePass123!',
                'full_name': 'John Doe',
            },
        ),
    ],
)
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField()
```

### Grouping Endpoints

Edit `backend/config/settings/api_docs.py`:

```python
SPECTACULAR_SETTINGS = {
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication'},
        {'name': 'Users', 'description': 'User management'},
        # Add more tags...
    ],
}
```

---

## Best Practices

### 1. Keep Documentation Updated

- Documentation auto-generates from code
- Update serializers when models change
- Add `@extend_schema` for complex endpoints
- Include examples for clarity

### 2. Use Descriptive Names

```python
# Good
@extend_schema(summary="List all active organizations")
def list(self, request):
    pass

# Better
@extend_schema(
    summary="List active organizations",
    description="Returns a paginated list of all organizations where the current user is a member."
)
def list(self, request):
    pass
```

### 3. Document Errors

```python
from drf_spectacular.utils import extend_schema
from rest_framework import status

@extend_schema(
    responses={
        200: UserSerializer,
        400: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT,
    }
)
def get_user(request, user_id):
    pass
```

### 4. Include Examples

- Provide realistic examples
- Cover edge cases
- Show both request and response

### 5. Version Your API

- Use URL versioning (`/api/v1/`, `/api/v2/`)
- Document breaking changes
- Maintain backward compatibility when possible

### 6. Security

- Document authentication requirements
- Show authorization errors (401, 403)
- Don't expose sensitive internal details

### 7. Testing

Test your API documentation:

```bash
# Validate schema
python manage.py spectacular --validate --file openapi.yaml

# Generate and test
python manage.py spectacular --file openapi.json
```

---

## Maintenance

### Updating Documentation

Documentation updates automatically when you:
- Add/modify Django REST Framework views
- Change serializers
- Update model fields
- Add `@extend_schema` decorators

### Regenerating Schema

```bash
# Export latest schema
python manage.py spectacular --file openapi.json

# Validate schema
python manage.py spectacular --validate
```

### Troubleshooting

**Schema not updating?**
- Restart Django development server
- Check for syntax errors in decorators
- Ensure `DEFAULT_SCHEMA_CLASS` is set correctly

**Missing endpoints?**
- Verify URL patterns are included
- Check `SCHEMA_PATH_PREFIX` in settings
- Ensure views inherit from DRF classes

**Authentication not working?**
- Check `SECURITY` settings in `api_docs.py`
- Verify token format (Bearer)
- Ensure auth classes are configured

---

## Resources

- [drf-spectacular Documentation](https://drf-spectacular.readthedocs.io/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [ReDoc](https://redocly.com/redoc/)
- [OpenAPI Generator](https://openapi-generator.tech/)

---

**The API documentation is accessible at:**
- **Development**: http://localhost:8000/api/docs/
- **Production**: https://api.yourdomain.com/api/docs/
