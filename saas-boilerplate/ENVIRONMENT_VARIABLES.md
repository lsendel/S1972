# Environment Variables Reference

**Last Updated**: November 28, 2025
**Version**: 1.0

This document describes all environment variables used in the SaaS boilerplate for backend and frontend applications.

---

## Table of Contents

1. [Backend Environment Variables](#backend-environment-variables)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Environment-Specific Configuration](#environment-specific-configuration)
4. [Security Best Practices](#security-best-practices)
5. [Secrets Management](#secrets-management)

---

## Backend Environment Variables

### Core Django Settings

#### `DJANGO_SECRET_KEY` **(Required)**
- **Description**: Secret key for cryptographic signing
- **Type**: String (50+ characters)
- **Example**: `django-insecure-CHANGE-THIS-TO-50-RANDOM-CHARACTERS-FOR-PRODUCTION`
- **Security**: ⚠️ **CRITICAL** - Must be kept secret, different per environment
- **Generation**:
  ```bash
  python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```

#### `DJANGO_SETTINGS_MODULE`
- **Description**: Django settings module to use
- **Type**: String
- **Default**: `config.settings.development`
- **Options**:
  - `config.settings.development` - Local development
  - `config.settings.production` - Production
  - `config.settings.test` - Test environment
- **Example**: `config.settings.production`

#### `DJANGO_DEBUG`
- **Description**: Enable debug mode
- **Type**: Boolean (True/False)
- **Default**: `False`
- **Production**: Must be `False`
- **Development**: Can be `True`
- **Example**: `False`

#### `DJANGO_ALLOWED_HOSTS`
- **Description**: Comma-separated list of allowed hosts
- **Type**: String (comma-separated)
- **Default**: `localhost,127.0.0.1`
- **Production**: Must include your domain(s)
- **Example**: `yourdomain.com,www.yourdomain.com,api.yourdomain.com`

---

### Database Configuration

#### `DATABASE_URL` **(Required)**
- **Description**: PostgreSQL database connection URL
- **Type**: String (URL format)
- **Format**: `postgres://user:password@host:port/database`
- **Example**: `postgres://saas_user:secure_password@db.example.com:5432/saas_production`
- **Security**: ⚠️ **SENSITIVE** - Contains database credentials
- **Development**: `postgres://postgres:postgres@localhost:5432/saas_dev`
- **Production**: Use managed database (AWS RDS, Google Cloud SQL)

---

### Redis Configuration

#### `REDIS_URL` **(Required)**
- **Description**: Redis connection URL for caching and Celery
- **Type**: String (URL format)
- **Format**: `redis://[:password@]host:port/db`
- **Example**: `redis://:secure_password@redis.example.com:6379/0`
- **Security**: ⚠️ **SENSITIVE** - May contain password
- **Development**: `redis://localhost:6379/0`
- **Production**: Use managed Redis (AWS ElastiCache, Google Memorystore)

---

### Email Configuration

#### `EMAIL_BACKEND`
- **Description**: Django email backend class
- **Type**: String (Python class path)
- **Default**: `django.core.mail.backends.console.EmailBackend` (development)
- **Production**: `django.core.mail.backends.smtp.EmailBackend`
- **Example**: `django.core.mail.backends.smtp.EmailBackend`

#### `EMAIL_HOST`
- **Description**: SMTP server hostname
- **Type**: String
- **Examples**:
  - SendGrid: `smtp.sendgrid.net`
  - Mailgun: `smtp.mailgun.org`
  - AWS SES: `email-smtp.us-east-1.amazonaws.com`
- **Default**: `localhost`

#### `EMAIL_PORT`
- **Description**: SMTP server port
- **Type**: Integer
- **Common Values**:
  - `25` - Unencrypted SMTP (not recommended)
  - `587` - TLS/STARTTLS (recommended)
  - `465` - SSL (deprecated)
- **Default**: `587`

#### `EMAIL_USE_TLS`
- **Description**: Use TLS encryption
- **Type**: Boolean
- **Default**: `True`
- **Production**: Should be `True`

#### `EMAIL_HOST_USER`
- **Description**: SMTP authentication username
- **Type**: String
- **Security**: ⚠️ **SENSITIVE**
- **Example**: `apikey` (SendGrid), your email address (others)

#### `EMAIL_HOST_PASSWORD`
- **Description**: SMTP authentication password/API key
- **Type**: String
- **Security**: ⚠️ **CRITICAL** - API key or password
- **Example**: `SG.xxxxxxxxxxxxxxxxxxxx` (SendGrid API key)

#### `DEFAULT_FROM_EMAIL`
- **Description**: Default sender email address
- **Type**: String (email format)
- **Example**: `noreply@yourdomain.com`
- **Default**: `webmaster@localhost`

---

### Stripe Configuration

#### `STRIPE_PUBLISHABLE_KEY` **(Required)**
- **Description**: Stripe publishable API key
- **Type**: String
- **Format**: Starts with `pk_test_` (test) or `pk_live_` (production)
- **Security**: Public - can be exposed in frontend
- **Example**: `pk_live_51xxxxxxxxxxxxxxxxxxxxxxxx`
- **Get Keys**: https://dashboard.stripe.com/apikeys

#### `STRIPE_SECRET_KEY` **(Required)**
- **Description**: Stripe secret API key
- **Type**: String
- **Format**: Starts with `sk_test_` (test) or `sk_live_` (production)
- **Security**: ⚠️ **CRITICAL** - Never expose to frontend
- **Example**: `sk_test_51xxxYOUR_TEST_KEYxxxxxxxxxxxxxxxxxxxxx` or `sk_live_51xxxYOUR_LIVE_KEYxxxxxxxxxxxxxxxxxxxx`

#### `STRIPE_WEBHOOK_SECRET` **(Required for production)**
- **Description**: Stripe webhook signing secret
- **Type**: String
- **Format**: Starts with `whsec_`
- **Security**: ⚠️ **CRITICAL** - Used to verify webhook authenticity
- **Example**: `whsec_xxxxxxxxxxxxxxxxxxxx`
- **Setup**: Configure at https://dashboard.stripe.com/webhooks

---

### OAuth Configuration

#### Google OAuth

#### `GOOGLE_OAUTH_CLIENT_ID`
- **Description**: Google OAuth 2.0 client ID
- **Type**: String
- **Example**: `123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Setup**: https://console.cloud.google.com/apis/credentials

#### `GOOGLE_OAUTH_CLIENT_SECRET`
- **Description**: Google OAuth 2.0 client secret
- **Type**: String
- **Security**: ⚠️ **SENSITIVE**
- **Example**: `GOCSPX-xxxxxxxxxxxxxxxxxxxx`

#### GitHub OAuth

#### `GITHUB_OAUTH_CLIENT_ID`
- **Description**: GitHub OAuth app client ID
- **Type**: String
- **Example**: `Iv1.xxxxxxxxxxxxxxxx`
- **Setup**: https://github.com/settings/developers

#### `GITHUB_OAUTH_CLIENT_SECRET`
- **Description**: GitHub OAuth app client secret
- **Type**: String
- **Security**: ⚠️ **SENSITIVE**
- **Example**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### Security & Encryption

#### `FIELD_ENCRYPTION_KEY` **(Required)**
- **Description**: Encryption key for sensitive database fields (TOTP secrets)
- **Type**: String (32 characters, URL-safe base64)
- **Security**: ⚠️ **CRITICAL** - Used to encrypt TOTP secrets and other sensitive data
- **Generation**:
  ```bash
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  ```
- **Example**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Important**: Changing this will invalidate existing encrypted data!

---

### Application URLs

#### `FRONTEND_URL` **(Required)**
- **Description**: Frontend application URL (for CORS, email links, etc.)
- **Type**: String (URL)
- **Development**: `http://localhost:5173` or `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Example**: `https://app.yourdomain.com`

#### `BACKEND_URL`
- **Description**: Backend API URL
- **Type**: String (URL)
- **Development**: `http://localhost:8000`
- **Production**: `https://api.yourdomain.com`
- **Default**: Inferred from request

---

### Monitoring & Observability

#### `SENTRY_DSN`
- **Description**: Sentry error tracking DSN (Data Source Name)
- **Type**: String (URL)
- **Required**: Production only
- **Example**: `https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/123456`
- **Setup**: https://sentry.io/
- **Security**: Can be public (frontend) or secret (backend)

#### `SENTRY_ENVIRONMENT`
- **Description**: Environment name for Sentry
- **Type**: String
- **Options**: `development`, `staging`, `production`
- **Default**: `production`
- **Example**: `production`

#### `RELEASE_VERSION`
- **Description**: Application version/release identifier
- **Type**: String
- **Example**: `1.0.0`, `abc123ef` (git commit hash)
- **Used by**: Sentry, logging, metrics

---

### Storage (AWS S3)

#### `AWS_ACCESS_KEY_ID`
- **Description**: AWS IAM access key ID
- **Type**: String
- **Security**: ⚠️ **SENSITIVE**
- **Example**: `AKIAIOSFODNN7EXAMPLE`
- **Recommendation**: Use IAM roles instead of keys when possible

#### `AWS_SECRET_ACCESS_KEY`
- **Description**: AWS IAM secret access key
- **Type**: String
- **Security**: ⚠️ **CRITICAL**
- **Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

#### `AWS_STORAGE_BUCKET_NAME`
- **Description**: S3 bucket name for static/media files
- **Type**: String
- **Example**: `yourdomain-static-production`

#### `AWS_S3_REGION_NAME`
- **Description**: AWS region for S3 bucket
- **Type**: String
- **Example**: `us-east-1`, `eu-west-1`
- **Default**: `us-east-1`

---

### Celery Configuration

#### `CELERY_BROKER_URL`
- **Description**: Celery message broker URL (usually same as REDIS_URL)
- **Type**: String (URL)
- **Default**: Uses `REDIS_URL`
- **Example**: `redis://localhost:6379/0`

#### `CELERY_RESULT_BACKEND`
- **Description**: Celery result backend URL
- **Type**: String (URL)
- **Default**: Uses `REDIS_URL`
- **Example**: `redis://localhost:6379/0`

---

## Frontend Environment Variables

All frontend variables must be prefixed with `VITE_` to be exposed to the application.

### API Configuration

#### `VITE_API_URL` **(Required)**
- **Description**: Backend API base URL
- **Type**: String (URL)
- **Development**: `http://localhost:8000`
- **Production**: `https://api.yourdomain.com`
- **Example**: `https://api.yourdomain.com`

---

### Stripe Configuration

#### `VITE_STRIPE_PUBLISHABLE_KEY` **(Required)**
- **Description**: Stripe publishable key (same as backend)
- **Type**: String
- **Example**: `pk_live_51xxxxxxxxxxxxxxxxxxxxxxxx`
- **Security**: Public - safe to expose

---

### OAuth Configuration

#### `VITE_GOOGLE_OAUTH_CLIENT_ID`
- **Description**: Google OAuth client ID (for frontend OAuth flow)
- **Type**: String
- **Example**: `123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`

#### `VITE_GITHUB_OAUTH_CLIENT_ID`
- **Description**: GitHub OAuth client ID (for frontend OAuth flow)
- **Type**: String
- **Example**: `Iv1.xxxxxxxxxxxxxxxx`

---

### Monitoring

#### `VITE_SENTRY_DSN`
- **Description**: Sentry DSN for frontend error tracking
- **Type**: String (URL)
- **Example**: `https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/123456`
- **Security**: Public - safe to expose

#### `VITE_ENVIRONMENT`
- **Description**: Environment name
- **Type**: String
- **Options**: `development`, `staging`, `production`
- **Example**: `production`

---

## Environment-Specific Configuration

### Development Environment

**File**: `backend/.env`

```bash
# Django
DJANGO_SETTINGS_MODULE=config.settings.development
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=dev-secret-key-not-for-production
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/saas_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=dev@localhost

# Stripe (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxx

# Encryption
FIELD_ENCRYPTION_KEY=test-encryption-key-32-characters

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

**File**: `frontend/.env`

```bash
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxx
VITE_ENVIRONMENT=development
```

---

### Production Environment

**File**: `backend/.env.production` (template - populate with real values)

```bash
# Django
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=CHANGE-THIS-TO-SECURE-50-CHARACTER-STRING
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Database (use managed service)
DATABASE_URL=postgres://user:password@db-host:5432/database

# Redis (use managed service)
REDIS_URL=redis://:password@redis-host:6379/0

# Email (production SMTP service)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Stripe (live mode)
STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx

# OAuth (production apps)
GOOGLE_OAUTH_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GITHUB_OAUTH_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_OAUTH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encryption (generate secure key)
FIELD_ENCRYPTION_KEY=GENERATE-SECURE-32-CHARACTER-KEY

# AWS S3 (for static files)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_STORAGE_BUCKET_NAME=yourdomain-static-production
AWS_S3_REGION_NAME=us-east-1

# URLs
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
RELEASE_VERSION=1.0.0
```

**File**: `frontend/.env.production` (template)

```bash
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxx
VITE_GOOGLE_OAUTH_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
VITE_GITHUB_OAUTH_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
VITE_ENVIRONMENT=production
```

---

## Security Best Practices

### 1. Never Commit Secrets to Git

```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Different Values Per Environment

- Each environment (dev, staging, production) should have unique secrets
- Never use development secrets in production
- Rotate production secrets regularly (every 90 days recommended)

### 3. Generate Strong Secrets

```bash
# Django secret key (50+ characters)
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Field encryption key (32 bytes, base64-encoded)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Random password (32 characters)
openssl rand -base64 32
```

### 4. Minimum Key Lengths

- **Django SECRET_KEY**: 50 characters
- **Passwords**: 16 characters minimum
- **Encryption keys**: 32 bytes (256 bits)
- **API keys**: Provider-specific

### 5. Secret Rotation

Create a rotation schedule:
- **Critical secrets** (encryption keys): Every 90 days
- **Database passwords**: Every 90 days
- **API keys**: Every 180 days
- **Django SECRET_KEY**: Every 365 days

---

## Secrets Management

### Development

Use `.env` files (already in `.gitignore`):

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values

cp frontend/.env.example frontend/.env
# Edit frontend/.env with your values
```

### Production

**Recommended**: Use managed secrets services

#### Option 1: AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name saas/production/django-secret-key \
  --secret-string "your-secret-key-here"

# Retrieve in application
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='saas/production/django-secret-key')
```

#### Option 2: Google Secret Manager

```bash
# Store secret
echo -n "your-secret-key" | gcloud secrets create django-secret-key --data-file=-

# Retrieve in application
from google.cloud import secretmanager
client = secretmanager.SecretManagerServiceClient()
name = "projects/PROJECT_ID/secrets/django-secret-key/versions/latest"
response = client.access_secret_version(request={"name": name})
secret = response.payload.data.decode("UTF-8")
```

#### Option 3: Environment Variables (Docker/Kubernetes)

```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
    # Or from file
    env_file:
      - .env.production
```

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: saas-secrets
type: Opaque
data:
  django-secret-key: <base64-encoded-value>
```

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All required variables are set
- [ ] No test/development secrets in production
- [ ] Strong, unique secrets generated
- [ ] HTTPS URLs used in production
- [ ] Debug mode is False
- [ ] Allowed hosts configured correctly
- [ ] Database uses managed service
- [ ] Redis uses managed service
- [ ] Email configured with production SMTP
- [ ] Stripe uses live keys (not test)
- [ ] OAuth apps configured for production
- [ ] Sentry DSN configured
- [ ] AWS credentials have minimal permissions
- [ ] Secrets stored securely (not in code)

---

## Troubleshooting

### Common Issues

#### "SECRET_KEY not set"
**Solution**: Set `DJANGO_SECRET_KEY` environment variable

#### "ImproperlyConfigured: ALLOWED_HOSTS"
**Solution**: Add your domain to `DJANGO_ALLOWED_HOSTS`

#### "CSRF verification failed"
**Solution**: Ensure `FRONTEND_URL` is correct and in CORS allowed origins

#### "Stripe error: Invalid API Key"
**Solution**: Check `STRIPE_SECRET_KEY` starts with `sk_live_` for production

#### "Email not sending"
**Solution**: Verify SMTP credentials and check email service logs

---

## References

- [Django Settings Documentation](https://docs.djangoproject.com/en/5.1/ref/settings/)
- [Twelve-Factor App: Config](https://12factor.net/config)
- [OWASP: Cryptographic Storage](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

---

**Last Updated**: November 28, 2025
**Maintained By**: Development Team
**Review Schedule**: Quarterly
