# GitHub Secrets Configuration Template

This file provides a complete list of secrets required for the CI/CD pipeline. Use this as a checklist when configuring your GitHub repository.

## Setup Instructions

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the secrets listed below

---

## Repository Secrets

These secrets are available to all workflows in the repository.

### Optional: Code Coverage

```
Name: CODECOV_TOKEN
Description: Token for uploading coverage reports to Codecov
Value: [Get from codecov.io after linking your repository]
Required: No (coverage upload will be skipped if not present)
```

### Optional: Enhanced GitHub API Access

```
Name: GH_APP_ID
Description: GitHub App ID for enhanced API access
Value: [Your GitHub App ID]
Required: No

Name: GH_APP_PRIVATE_KEY
Description: GitHub App private key for authentication
Value: [Your GitHub App private key - full PEM format]
Required: No
```

---

## Environment: staging

Go to **Settings** → **Environments** → **staging** → **Add secret**

### Django/Backend Configuration

```
Name: DATABASE_URL
Description: PostgreSQL database connection string
Value: postgresql://username:password@hostname:5432/database_name
Example: postgresql://saas_user:secure_password@staging-db.example.com:5432/saas_staging
Required: Yes

Name: REDIS_URL
Description: Redis connection string
Value: redis://hostname:6379/0
Example: redis://staging-redis.example.com:6379/0
Required: Yes

Name: DJANGO_SECRET_KEY
Description: Django secret key (minimum 50 characters)
Value: [Generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"]
Example: django-insecure-abc123...xyz789 (50+ characters)
Required: Yes

Name: FIELD_ENCRYPTION_KEY
Description: Fernet encryption key for encrypted fields (32 characters)
Value: [Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"]
Example: xyzABC123...== (44 characters base64)
Required: Yes

Name: FRONTEND_URL
Description: Frontend application URL
Value: https://staging.example.com
Required: Yes

Name: BACKEND_URL
Description: Backend API URL
Value: https://api-staging.example.com
Required: Yes
```

### Stripe Configuration (Test Mode)

```
Name: STRIPE_SECRET_KEY
Description: Stripe secret key (test mode for staging)
Value: sk_test_...
Required: Yes (if using Stripe)

Name: STRIPE_PUBLISHABLE_KEY
Description: Stripe publishable key (test mode)
Value: pk_test_...
Required: Yes (if using Stripe)

Name: STRIPE_WEBHOOK_SECRET
Description: Stripe webhook signing secret
Value: whsec_...
Required: Yes (if using Stripe webhooks)
```

### Email Configuration

```
Name: EMAIL_HOST
Description: SMTP server hostname
Value: smtp.sendgrid.net
Required: Yes

Name: EMAIL_PORT
Description: SMTP server port
Value: 587
Required: Yes

Name: EMAIL_HOST_USER
Description: SMTP username
Value: apikey (for SendGrid) or your email
Required: Yes

Name: EMAIL_HOST_PASSWORD
Description: SMTP password or API key
Value: [Your SMTP password or SendGrid API key]
Required: Yes

Name: DEFAULT_FROM_EMAIL
Description: Default sender email address
Value: noreply@staging.example.com
Required: Yes
```

### Monitoring and Logging (Optional)

```
Name: SENTRY_DSN
Description: Sentry DSN for error tracking
Value: https://...@sentry.io/...
Required: No

Name: SENTRY_ENVIRONMENT
Description: Sentry environment name
Value: staging
Required: No (if using Sentry)
```

### Deployment Configuration

```
Name: DEPLOY_SSH_KEY
Description: SSH private key for deployment
Value: [Full SSH private key including -----BEGIN... and -----END...]
Required: Yes (for automated deployment)

Name: DEPLOY_HOST
Description: Deployment server hostname
Value: staging.example.com
Required: Yes (for automated deployment)

Name: DEPLOY_USER
Description: SSH username for deployment
Value: deploy
Required: Yes (for automated deployment)

Name: DEPLOY_PORT
Description: SSH port (optional, defaults to 22)
Value: 22
Required: No
```

---

## Environment: production

Go to **Settings** → **Environments** → **production** → **Add secret**

**IMPORTANT**: Production environment should have manual approval enabled!

### Django/Backend Configuration

```
Name: DATABASE_URL
Description: PostgreSQL database connection string (PRODUCTION)
Value: postgresql://username:password@hostname:5432/database_name
Example: postgresql://saas_user:STRONG_PASSWORD@prod-db.example.com:5432/saas_production
Required: Yes
SECURITY: Use a strong, unique password different from staging

Name: REDIS_URL
Description: Redis connection string (PRODUCTION)
Value: redis://hostname:6379/0
Example: redis://prod-redis.example.com:6379/0
Required: Yes

Name: DJANGO_SECRET_KEY
Description: Django secret key (PRODUCTION - minimum 50 characters)
Value: [Generate new key, DIFFERENT from staging]
Required: Yes
SECURITY: MUST be different from staging

Name: FIELD_ENCRYPTION_KEY
Description: Fernet encryption key (PRODUCTION - 32 characters)
Value: [Generate new key, DIFFERENT from staging]
Required: Yes
SECURITY: MUST be different from staging
WARNING: Changing this will make existing encrypted data unreadable

Name: FRONTEND_URL
Description: Frontend application URL
Value: https://example.com
Required: Yes

Name: BACKEND_URL
Description: Backend API URL
Value: https://api.example.com
Required: Yes
```

### Stripe Configuration (Live Mode)

```
Name: STRIPE_SECRET_KEY
Description: Stripe secret key (LIVE MODE)
Value: sk_live_...
Required: Yes (if using Stripe)
SECURITY: This is a LIVE key - handle with extreme care

Name: STRIPE_PUBLISHABLE_KEY
Description: Stripe publishable key (live mode)
Value: pk_live_...
Required: Yes (if using Stripe)

Name: STRIPE_WEBHOOK_SECRET
Description: Stripe webhook signing secret (live mode)
Value: whsec_...
Required: Yes (if using Stripe webhooks)
SECURITY: Configure webhook endpoint in Stripe Dashboard
```

### Email Configuration

```
Name: EMAIL_HOST
Description: SMTP server hostname
Value: smtp.sendgrid.net
Required: Yes

Name: EMAIL_PORT
Description: SMTP server port
Value: 587
Required: Yes

Name: EMAIL_HOST_USER
Description: SMTP username
Value: apikey or your email
Required: Yes

Name: EMAIL_HOST_PASSWORD
Description: SMTP password or API key (PRODUCTION)
Value: [Production SMTP credentials]
Required: Yes
SECURITY: Use production-grade email service

Name: DEFAULT_FROM_EMAIL
Description: Default sender email address
Value: noreply@example.com
Required: Yes
```

### Monitoring and Logging

```
Name: SENTRY_DSN
Description: Sentry DSN for error tracking (PRODUCTION)
Value: https://...@sentry.io/...
Required: Strongly Recommended

Name: SENTRY_ENVIRONMENT
Description: Sentry environment name
Value: production
Required: Yes (if using Sentry)

Name: SENTRY_TRACES_SAMPLE_RATE
Description: Percentage of transactions to trace (0.0 to 1.0)
Value: 0.1
Required: No (defaults to appropriate value)
```

### Deployment Configuration

```
Name: DEPLOY_SSH_KEY
Description: SSH private key for production deployment
Value: [Production SSH private key - DIFFERENT from staging]
Required: Yes (for automated deployment)
SECURITY: Use a separate key from staging

Name: DEPLOY_HOST
Description: Production deployment server hostname
Value: example.com
Required: Yes (for automated deployment)

Name: DEPLOY_USER
Description: SSH username for production deployment
Value: deploy
Required: Yes (for automated deployment)

Name: DEPLOY_PORT
Description: SSH port (optional)
Value: 22
Required: No

Name: BACKUP_BUCKET
Description: S3 bucket for database backups
Value: s3://my-app-backups
Required: Recommended

Name: AWS_ACCESS_KEY_ID
Description: AWS access key for backups
Value: AKIA...
Required: If using S3 backups

Name: AWS_SECRET_ACCESS_KEY
Description: AWS secret key for backups
Value: [AWS secret access key]
Required: If using S3 backups
```

### External Services (Optional)

```
Name: SLACK_WEBHOOK_URL
Description: Slack webhook for deployment notifications
Value: https://hooks.slack.com/services/...
Required: No

Name: DISCORD_WEBHOOK_URL
Description: Discord webhook for notifications
Value: https://discord.com/api/webhooks/...
Required: No
```

---

## Secret Generation Commands

### Django Secret Key (50+ characters)

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Field Encryption Key (Fernet)

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### SSH Key Pair for Deployment

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "deploy@github-actions" -f deploy_key

# Private key goes in GitHub Secrets (DEPLOY_SSH_KEY)
cat deploy_key

# Public key goes on deployment server
cat deploy_key.pub
# Add to ~/.ssh/authorized_keys on deployment server
```

### Strong Random Password

```bash
# Generate 32-character password
openssl rand -base64 32
```

---

## Security Best Practices

### Secret Rotation Schedule

| Secret Type | Staging Rotation | Production Rotation |
|-------------|------------------|---------------------|
| Database passwords | Every 180 days | Every 90 days |
| Django secret keys | Every 180 days | Every 90 days |
| API keys (Stripe, etc.) | As needed | Every 90 days |
| SSH keys | Every 180 days | Every 90 days |
| Email credentials | Every 180 days | Every 90 days |

### Handling Secrets

✅ **DO**:
- Generate strong, unique secrets for each environment
- Use different secrets for staging and production
- Store secrets only in GitHub Secrets (never in code)
- Rotate secrets regularly
- Use read-only access where possible
- Document when secrets were last rotated

❌ **DON'T**:
- Commit secrets to git (use .env.example with dummy values)
- Share secrets in Slack/Discord/Email
- Reuse the same secret across environments
- Give production secrets to developers unnecessarily
- Log secrets in application logs

### Secret Access Control

**Staging Secrets**:
- Accessible to: All developers
- Purpose: Testing and development

**Production Secrets**:
- Accessible to: Senior developers, DevOps, team leads only
- Purpose: Live production environment
- Require: Manual approval for deployment

---

## Verification Checklist

After adding secrets, verify configuration:

### Staging Environment

- [ ] All required secrets added
- [ ] Test database connection works
- [ ] Test Redis connection works
- [ ] Stripe test mode keys configured
- [ ] Email sending works (test with Mailpit or staging SMTP)
- [ ] Sentry error tracking works (optional)
- [ ] Deployment SSH access configured

### Production Environment

- [ ] All required secrets added
- [ ] Production secrets are DIFFERENT from staging
- [ ] Manual approval is enabled for production environment
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] Stripe live mode keys configured and tested
- [ ] Production email sending tested
- [ ] Sentry error tracking configured
- [ ] Database backup process configured
- [ ] Deployment SSH access configured and restricted

### Repository Secrets

- [ ] Codecov token added (optional)
- [ ] GitHub App credentials added (optional)

---

## Troubleshooting

### Secret not found error

**Error**: `Secret DATABASE_URL not found`

**Solution**:
1. Verify secret is added to correct environment (staging/production)
2. Check secret name matches exactly (case-sensitive)
3. Ensure workflow job specifies correct environment

### Connection failures

**Error**: `Could not connect to database`

**Solution**:
1. Verify DATABASE_URL format is correct
2. Check database server is accessible from GitHub Actions
3. Verify firewall allows GitHub Actions IP ranges
4. Test connection from another server

### Invalid secret key error

**Error**: `Invalid secret key format`

**Solution**:
1. Regenerate key using commands above
2. Ensure no extra spaces or newlines
3. For multi-line secrets (SSH keys), include full content

---

## Support

For issues with secrets configuration:
1. Check GitHub Actions logs for specific error messages
2. Review CI_CD.md troubleshooting section
3. Verify secret values using `echo ${SECRET_NAME}` in workflow (NEVER log actual secret values)
4. Contact team lead for production secret access

---

**Security Notice**: This file contains instructions only, not actual secrets. Never commit actual secret values to this repository.

**Last Updated**: 2025-01-XX
