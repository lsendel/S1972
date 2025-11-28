#!/bin/bash

################################################################################
# Security Audit Script
#
# This script performs basic security checks on the SaaS platform
#
# Usage:
#   ./security-audit.sh [domain]
#
# Example:
#   ./security-audit.sh yourdomain.com
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOMAIN="${1:-}"
REPORT_FILE="security-audit-$(date +%Y%m%d_%H%M%S).txt"

# Print header
echo "========================================" | tee "$REPORT_FILE"
echo "Security Audit Report" | tee -a "$REPORT_FILE"
echo "Date: $(date)" | tee -a "$REPORT_FILE"
echo "Domain: ${DOMAIN:-Local Audit}" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Check counter
PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$REPORT_FILE"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1" | tee -a "$REPORT_FILE"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$REPORT_FILE"
    ((WARN++))
}

# 1. Check Python Dependencies for Vulnerabilities
echo "1. Checking Python Dependencies..." | tee -a "$REPORT_FILE"
if command -v pip-audit &> /dev/null; then
    cd /var/www/saas-platform/saas-boilerplate/backend 2>/dev/null || cd ./saas-boilerplate/backend || {
        check_warn "Backend directory not found, skipping dependency check"
    }

    if pip-audit --desc 2>&1 | grep -q "No known vulnerabilities found"; then
        check_pass "No known vulnerabilities in Python dependencies"
    else
        check_fail "Vulnerabilities found in Python dependencies - run 'pip-audit' for details"
    fi
else
    check_warn "pip-audit not installed - install with: pip install pip-audit"
fi
echo "" | tee -a "$REPORT_FILE"

# 2. Check Node Dependencies for Vulnerabilities
echo "2. Checking Node Dependencies..." | tee -a "$REPORT_FILE"
if command -v npm &> /dev/null; then
    cd /var/www/saas-platform/saas-boilerplate/frontend 2>/dev/null || cd ./saas-boilerplate/frontend || {
        check_warn "Frontend directory not found, skipping npm audit"
    }

    if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
        check_pass "No high/critical vulnerabilities in Node dependencies"
    else
        check_fail "Vulnerabilities found in Node dependencies - run 'npm audit' for details"
    fi
else
    check_warn "npm not installed - skipping Node dependency check"
fi
echo "" | tee -a "$REPORT_FILE"

# 3. Check Environment Files
echo "3. Checking Environment Configuration..." | tee -a "$REPORT_FILE"

if [ -f "./saas-boilerplate/backend/.env" ] || [ -f "/var/www/saas-platform/saas-boilerplate/backend/.env" ]; then
    ENV_FILE="./saas-boilerplate/backend/.env"
    [ -f "/var/www/saas-platform/saas-boilerplate/backend/.env" ] && ENV_FILE="/var/www/saas-platform/saas-boilerplate/backend/.env"

    # Check for default/insecure values
    if grep -q "DJANGO_SECRET_KEY=your-secret-key-here" "$ENV_FILE" 2>/dev/null; then
        check_fail "Default Django secret key detected - must be changed!"
    else
        check_pass "Django secret key appears to be customized"
    fi

    if grep -q "DEBUG=True" "$ENV_FILE" 2>/dev/null; then
        check_fail "DEBUG mode is enabled - must be False in production!"
    else
        check_pass "DEBUG mode is disabled"
    fi

    if grep -q "DB_PASSWORD=.*password" "$ENV_FILE" 2>/dev/null; then
        check_warn "Database password may be weak - ensure strong password is used"
    else
        check_pass "Database password appears secure"
    fi
else
    check_warn "Backend .env file not found"
fi
echo "" | tee -a "$REPORT_FILE"

# 4. Check File Permissions
echo "4. Checking File Permissions..." | tee -a "$REPORT_FILE"

if [ -f "$ENV_FILE" ]; then
    PERMS=$(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %A "$ENV_FILE" 2>/dev/null || echo "unknown")

    if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
        check_pass ".env file has secure permissions ($PERMS)"
    else
        check_fail ".env file has insecure permissions ($PERMS) - should be 600 or 400"
    fi
fi
echo "" | tee -a "$REPORT_FILE"

# 5. Check SSL/TLS Configuration (if domain provided)
if [ -n "$DOMAIN" ]; then
    echo "5. Checking SSL/TLS Configuration..." | tee -a "$REPORT_FILE"

    if command -v curl &> /dev/null; then
        # Check if HTTPS is accessible
        if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
            check_pass "HTTPS is accessible on $DOMAIN"
        else
            check_fail "HTTPS not accessible on $DOMAIN"
        fi

        # Check if HTTP redirects to HTTPS
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$DOMAIN" | head -1)
        if curl -s -I "http://$DOMAIN" | grep -q "Location: https://"; then
            check_pass "HTTP redirects to HTTPS"
        else
            check_warn "HTTP may not redirect to HTTPS - verify configuration"
        fi
    else
        check_warn "curl not installed - skipping SSL checks"
    fi
    echo "" | tee -a "$REPORT_FILE"

    # 6. Check Security Headers
    echo "6. Checking Security Headers..." | tee -a "$REPORT_FILE"

    HEADERS=$(curl -s -I "https://$DOMAIN" 2>/dev/null || echo "")

    if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
        check_pass "HSTS header present"
    else
        check_fail "HSTS header missing"
    fi

    if echo "$HEADERS" | grep -qi "X-Content-Type-Options.*nosniff"; then
        check_pass "X-Content-Type-Options header present"
    else
        check_fail "X-Content-Type-Options header missing"
    fi

    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        check_pass "X-Frame-Options header present"
    else
        check_fail "X-Frame-Options header missing"
    fi

    if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
        check_pass "Content-Security-Policy header present"
    else
        check_warn "Content-Security-Policy header missing or not detected"
    fi

    if echo "$HEADERS" | grep -qi "Referrer-Policy"; then
        check_pass "Referrer-Policy header present"
    else
        check_warn "Referrer-Policy header missing"
    fi

    echo "" | tee -a "$REPORT_FILE"
fi

# 7. Check Firewall Status (Linux only)
echo "7. Checking Firewall Configuration..." | tee -a "$REPORT_FILE"

if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        check_pass "UFW firewall is active"

        # Check if only necessary ports are open
        if sudo ufw status | grep -q "80.*ALLOW"; then
            check_pass "Port 80 (HTTP) is allowed"
        fi

        if sudo ufw status | grep -q "443.*ALLOW"; then
            check_pass "Port 443 (HTTPS) is allowed"
        fi

        if sudo ufw status | grep -q "22.*ALLOW"; then
            check_warn "Port 22 (SSH) is open - ensure it's properly secured"
        fi
    else
        check_fail "UFW firewall is not active"
    fi
elif command -v firewalld &> /dev/null; then
    if sudo firewall-cmd --state 2>/dev/null | grep -q "running"; then
        check_pass "Firewalld is running"
    else
        check_fail "Firewalld is not running"
    fi
else
    check_warn "No firewall detected (UFW or firewalld)"
fi
echo "" | tee -a "$REPORT_FILE"

# 8. Check Fail2Ban Status
echo "8. Checking Fail2Ban..." | tee -a "$REPORT_FILE"

if command -v fail2ban-client &> /dev/null; then
    if sudo fail2ban-client status &> /dev/null; then
        check_pass "Fail2Ban is running"
    else
        check_fail "Fail2Ban is installed but not running"
    fi
else
    check_warn "Fail2Ban is not installed"
fi
echo "" | tee -a "$REPORT_FILE"

# 9. Check SSH Configuration
echo "9. Checking SSH Configuration..." | tee -a "$REPORT_FILE"

if [ -f "/etc/ssh/sshd_config" ]; then
    if grep -q "^PermitRootLogin no" /etc/ssh/sshd_config; then
        check_pass "Root login via SSH is disabled"
    else
        check_fail "Root login via SSH may be enabled - should be disabled"
    fi

    if grep -q "^PasswordAuthentication no" /etc/ssh/sshd_config; then
        check_pass "Password authentication is disabled (key-only)"
    else
        check_warn "Password authentication may be enabled - consider using keys only"
    fi
else
    check_warn "SSH configuration file not found"
fi
echo "" | tee -a "$REPORT_FILE"

# 10. Check Database Configuration
echo "10. Checking Database Security..." | tee -a "$REPORT_FILE"

if command -v psql &> /dev/null; then
    # Check if PostgreSQL is listening only on localhost
    if ss -tlnp 2>/dev/null | grep postgres | grep -q "127.0.0.1:5432"; then
        check_pass "PostgreSQL is listening on localhost only"
    elif netstat -tlnp 2>/dev/null | grep postgres | grep -q "127.0.0.1:5432"; then
        check_pass "PostgreSQL is listening on localhost only"
    else
        check_warn "PostgreSQL may be listening on public interface - verify configuration"
    fi
else
    check_warn "PostgreSQL not detected on this system"
fi
echo "" | tee -a "$REPORT_FILE"

# Summary
echo "========================================" | tee -a "$REPORT_FILE"
echo "Audit Summary" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo -e "${GREEN}Passed:${NC} $PASS" | tee -a "$REPORT_FILE"
echo -e "${YELLOW}Warnings:${NC} $WARN" | tee -a "$REPORT_FILE"
echo -e "${RED}Failed:${NC} $FAIL" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Security audit completed with no failures${NC}" | tee -a "$REPORT_FILE"
else
    echo -e "${RED}✗ Security audit found $FAIL issue(s) that need attention${NC}" | tee -a "$REPORT_FILE"
fi

echo "" | tee -a "$REPORT_FILE"
echo "Full report saved to: $REPORT_FILE" | tee -a "$REPORT_FILE"

# Exit with appropriate code
if [ $FAIL -gt 0 ]; then
    exit 1
else
    exit 0
fi
