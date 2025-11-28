# Security Guide

This document outlines the security measures implemented in the SaaS platform and best practices for maintaining security.

---

## Table of Contents

1. [Security Features](#security-features)
2. [Security Headers](#security-headers)
3. [Authentication Security](#authentication-security)
4. [Data Protection](#data-protection)
5. [API Security](#api-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Monitoring & Incident Response](#monitoring--incident-response)
8. [Security Checklist](#security-checklist)
9. [Compliance](#compliance)

---

## Security Features

### Built-in Security Measures

- **HTTPS Enforcement**: All traffic redirected to HTTPS
- **HSTS**: HTTP Strict Transport Security with 1-year max-age
- **CSRF Protection**: Django CSRF tokens on all state-changing requests
- **XSS Protection**: Content Security Policy and output escaping
- **SQL Injection Prevention**: Django ORM parameterized queries
- **Clickjacking Protection**: X-Frame-Options: DENY
- **Password Hashing**: Argon2 (OWASP recommended)
- **Rate Limiting**: API and authentication endpoint throttling
- **2FA**: Time-based One-Time Passwords (TOTP)
- **Session Security**: Secure, HttpOnly cookies
- **Input Validation**: Comprehensive request validation
- **Error Handling**: No sensitive data in error messages

---

## Security Headers

### Implemented Headers

```python
# HTTPS and Transport Security
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Clickjacking Protection
X-Frame-Options: DENY

# XSS Protection
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block

# Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...

# Referrer Control
Referrer-Policy: strict-origin-when-cross-origin

# Permissions Policy
Permissions-Policy: geolocation=(), microphone=(), camera=()

# Additional Headers
X-Download-Options: noopen
X-DNS-Prefetch-Control: off
```

### Configuration Location

Security headers are configured in:
- `backend/config/settings/production.py` (Django settings)
- `backend/apps/core/middleware/security.py` (Custom middleware)
- `nginx/conf.d/saas-platform.conf` (Nginx configuration)

### Testing Security Headers

Use [Security Headers](https://securityheaders.com/) to scan your domain:

```bash
# Example
https://securityheaders.com/?q=yourdomain.com
```

Target: **A+ rating**

---

## Authentication Security

### Password Security

**Requirements:**
- Minimum 8 characters
- Must include uppercase, lowercase, numbers
- No common passwords (Django's password validators)
- Hashed with Argon2

**Password Reset:**
- Tokens expire after 1 hour
- One-time use only
- Sent via secure email
- Rate limited to prevent abuse

**Account Lockout:**
- 5 failed attempts trigger temporary lockout
- Lockout duration: 15 minutes
- Notifications sent to account owner

### Two-Factor Authentication (2FA)

- TOTP-based (compatible with Google Authenticator, Authy)
- Backup codes for recovery
- Required for admin users
- Optional for regular users

### Session Management

```python
# Session settings
SESSION_COOKIE_SECURE = True          # HTTPS only
SESSION_COOKIE_HTTPONLY = True        # No JavaScript access
SESSION_COOKIE_SAMESITE = 'Strict'    # CSRF protection
SESSION_COOKIE_AGE = 1209600          # 2 weeks
```

### OAuth Security

- State parameter for CSRF protection
- Token validation
- Scope restrictions
- Revocation support

---

## Data Protection

### Encryption

**At Rest:**
- Database: PostgreSQL encryption (if enabled)
- Backups: Encrypted with GPG (optional)
- Media files: Can use AWS S3 with encryption

**In Transit:**
- TLS 1.2+ only
- Strong cipher suites
- Perfect Forward Secrecy (PFS)

### Sensitive Data Handling

**PII (Personally Identifiable Information):**
- Email addresses (encrypted in database - optional)
- Names (access logged)
- Payment information (never stored, Stripe handles)

**Secrets Management:**
- Environment variables (not in code)
- `.env` files (not in version control)
- Secrets rotation (recommended: quarterly)

### Data Retention

- User data: Retained while account active
- Deleted accounts: Data purged after 30 days
- Backups: 7-30 days retention
- Logs: 90 days retention

---

## API Security

### Authentication

- JWT tokens with RS256 algorithm
- Token expiration: 1 hour (access), 7 days (refresh)
- Token rotation on refresh
- Revocation list for compromised tokens

### Rate Limiting

**Endpoints:**
```python
# Authentication
POST /api/v1/auth/login/        # 5 requests/minute
POST /api/v1/auth/register/     # 3 requests/minute
POST /api/v1/auth/reset-password/  # 3 requests/minute

# API
GET /api/v1/*                   # 100 requests/minute
POST /api/v1/*                  # 50 requests/minute
```

### Input Validation

- JSON schema validation
- Type checking
- Length restrictions
- Sanitization of user input
- File upload restrictions (type, size)

### CORS Configuration

```python
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]
CORS_ALLOW_CREDENTIALS = True
```

---

## Infrastructure Security

### Server Hardening

**Firewall (UFW):**
```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

**Fail2Ban:**
- SSH brute force protection
- HTTP authentication failure protection
- Automatic IP banning

**SSH Security:**
```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### Database Security

**PostgreSQL:**
```python
# SSL required
DATABASES = {
    'default': {
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}
```

**Access Control:**
- Database user has minimal permissions
- No superuser access from application
- Connection pooling with PgBouncer

### Redis Security

```bash
# redis.conf
bind 127.0.0.1
protected-mode yes
requirepass strong-password-here
maxmemory-policy allkeys-lru
```

### Docker Security

**Best Practices:**
- Run containers as non-root user
- Read-only filesystems where possible
- Resource limits (CPU, memory)
- Network isolation
- Regular image updates

**Example:**
```dockerfile
# Run as non-root
RUN useradd -m -u 1000 appuser
USER appuser

# Health checks
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/health/
```

---

## Monitoring & Incident Response

### Security Monitoring

**Sentry Integration:**
- Real-time error tracking
- Security event logging
- Performance monitoring
- Release tracking

**Log Monitoring:**
```bash
# Critical events to monitor
- Failed login attempts
- Permission denied errors
- 500 server errors
- Database connection failures
- Payment processing errors
```

### Incident Response Plan

**1. Detection**
- Automated alerts (Sentry, logs)
- User reports
- Security scans

**2. Assessment**
- Determine severity
- Identify affected systems
- Document timeline

**3. Containment**
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs

**4. Remediation**
- Apply security patches
- Update credentials
- Fix vulnerabilities

**5. Recovery**
- Restore services
- Verify security
- Monitor for re-infection

**6. Post-Incident**
- Document lessons learned
- Update security measures
- Notify affected users (if required)

### Security Contacts

```python
# settings.py
ADMINS = [
    ('Security Team', 'security@yourdomain.com'),
]

MANAGERS = ADMINS
```

---

## Security Checklist

### Development

- [ ] No secrets in code or version control
- [ ] Input validation on all user input
- [ ] Output encoding to prevent XSS
- [ ] SQL injection prevention (use ORM)
- [ ] CSRF tokens on state-changing requests
- [ ] Secure dependencies (no known vulnerabilities)
- [ ] Code review before merge
- [ ] Security-focused testing

### Deployment

- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban enabled
- [ ] Database SSL enabled
- [ ] Redis password protected
- [ ] SSH key-only authentication
- [ ] Non-root user for services
- [ ] File permissions restricted
- [ ] Debug mode disabled

### Operations

- [ ] Regular security updates
- [ ] Dependency updates (monthly)
- [ ] Password rotation (quarterly)
- [ ] Backup testing (monthly)
- [ ] Security scanning (weekly)
- [ ] Log review (daily)
- [ ] Access review (quarterly)
- [ ] Incident response plan documented

### Monitoring

- [ ] Sentry configured
- [ ] Error alerts set up
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Security event alerts
- [ ] Rate limit monitoring

---

## Compliance

### GDPR Compliance

**User Rights:**
- Right to access (user profile export)
- Right to erasure (account deletion)
- Right to rectification (profile updates)
- Right to data portability (export feature)

**Implementation:**
- Privacy policy
- Cookie consent
- Data processing agreements
- Breach notification (72 hours)

### PCI DSS

**Payment Security:**
- No credit card storage
- Stripe handles PCI compliance
- HTTPS for all payment pages
- Security logging

### Security Testing

**Regular Testing:**
```bash
# Dependency vulnerabilities
pip-audit
npm audit

# Security linting
bandit -r backend/
safety check

# OWASP ZAP scanning
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourdomain.com
```

**Penetration Testing:**
- Recommended: Annually
- Third-party security audit
- Vulnerability disclosure program

---

## Vulnerability Reporting

If you discover a security vulnerability, please report it to:

**Email:** security@yourdomain.com

**PGP Key:** [Optional: Include PGP key for encrypted communication]

**What to Include:**
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Response Time:**
- Acknowledgment: Within 24 hours
- Initial assessment: Within 48 hours
- Resolution timeline: Based on severity

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Security Headers](https://securityheaders.com/)
- [SSL Server Test](https://www.ssllabs.com/ssltest/)

---

**Last Updated:** 2024
**Review Frequency:** Quarterly
