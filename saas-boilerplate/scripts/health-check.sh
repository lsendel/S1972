#!/bin/bash

# Health Check Script
# Comprehensive health check for deployed application
# Can be used for monitoring and smoke tests

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
BASE_URL="${2}"

if [ -z "$BASE_URL" ]; then
    if [ "$ENVIRONMENT" == "production" ]; then
        BASE_URL="https://example.com"
    else
        BASE_URL="https://staging.example.com"
    fi
fi

echo -e "${COLOR_BLUE}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║         Health Check Utility               ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}Environment:${COLOR_RESET}  $ENVIRONMENT"
echo -e "${COLOR_BLUE}Base URL:${COLOR_RESET}     $BASE_URL"
echo ""

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run health check
check_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    local timeout=${4:-5}

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "  Testing $name... "

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" == "$expected_code" ]; then
        echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET} (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${COLOR_RED}✗ FAIL${COLOR_RESET} (HTTP $HTTP_CODE, expected $expected_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to check response time
check_response_time() {
    local name=$1
    local url=$2
    local max_time=$3

    echo -n "  Testing $name response time... "

    TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$max_time" "$url" 2>/dev/null || echo "999")
    TIME_MS=$(echo "$TIME * 1000" | bc)

    MAX_MS=$(echo "$max_time * 1000" | bc)

    if (( $(echo "$TIME_MS < $MAX_MS" | bc -l) )); then
        echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET} (${TIME_MS}ms < ${MAX_MS}ms)"
        return 0
    else
        echo -e "${COLOR_RED}✗ FAIL${COLOR_RESET} (${TIME_MS}ms >= ${MAX_MS}ms)"
        return 1
    fi
}

# Backend API Health Checks
echo -e "${COLOR_YELLOW}Backend API:${COLOR_RESET}"
check_endpoint "Health endpoint" "$BASE_URL/api/v1/health/" 200 10
check_endpoint "Readiness endpoint" "$BASE_URL/api/v1/ready/" 200 10
check_endpoint "Liveness endpoint" "$BASE_URL/api/v1/live/" 200 10
check_response_time "Health response time" "$BASE_URL/api/v1/health/" 1.0

echo ""

# Frontend Checks
echo -e "${COLOR_YELLOW}Frontend:${COLOR_RESET}"
check_endpoint "Homepage" "$BASE_URL/" 200 10
check_endpoint "Login page" "$BASE_URL/login" 200 10
check_response_time "Homepage response time" "$BASE_URL/" 2.0

echo ""

# API Endpoints (if accessible)
echo -e "${COLOR_YELLOW}API Endpoints:${COLOR_RESET}"
check_endpoint "API root" "$BASE_URL/api/v1/" 200 10
check_endpoint "Auth endpoints" "$BASE_URL/api/v1/auth/" 200 10

echo ""

# Static Files
echo -e "${COLOR_YELLOW}Static Files:${COLOR_RESET}"
check_endpoint "Admin static files" "$BASE_URL/static/admin/css/base.css" 200 10

echo ""

# SSL/TLS Check
echo -e "${COLOR_YELLOW}Security:${COLOR_RESET}"
echo -n "  Checking SSL certificate... "

SSL_INFO=$(echo | openssl s_client -servername "$(echo "$BASE_URL" | sed 's|https://||' | sed 's|/.*||')" -connect "$(echo "$BASE_URL" | sed 's|https://||' | sed 's|/.*||'):443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ $? -eq 0 ]; then
    EXPIRY=$(echo "$SSL_INFO" | grep "notAfter" | cut -d= -f2)
    echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET} (Expires: $EXPIRY)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${COLOR_RED}✗ FAIL${COLOR_RESET} (Could not verify SSL)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""

# DNS Resolution
echo -e "${COLOR_YELLOW}Infrastructure:${COLOR_RESET}"
echo -n "  Checking DNS resolution... "

HOSTNAME=$(echo "$BASE_URL" | sed 's|https://||' | sed 's|http://||' | sed 's|/.*||')
DNS_RESULT=$(dig +short "$HOSTNAME" | head -1)

if [ -n "$DNS_RESULT" ]; then
    echo -e "${COLOR_GREEN}✓ PASS${COLOR_RESET} (Resolves to: $DNS_RESULT)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${COLOR_RED}✗ FAIL${COLOR_RESET} (Could not resolve DNS)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""

# Summary
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_BLUE}Summary${COLOR_RESET}"
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo ""
echo -e "Tests run:    $TESTS_RUN"
echo -e "Tests passed: ${COLOR_GREEN}$TESTS_PASSED${COLOR_RESET}"
echo -e "Tests failed: ${COLOR_RED}$TESTS_FAILED${COLOR_RESET}"
echo ""

# Exit code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${COLOR_GREEN}✓ All health checks passed${COLOR_RESET}"
    echo ""
    exit 0
else
    echo -e "${COLOR_RED}✗ Some health checks failed${COLOR_RESET}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check application logs"
    echo "  2. Verify all services are running"
    echo "  3. Check network connectivity"
    echo "  4. Review recent deployments"
    echo ""
    exit 1
fi
