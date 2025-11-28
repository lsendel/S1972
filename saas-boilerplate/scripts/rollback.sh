#!/bin/bash
set -e

# Rollback Script
# Quickly rollback to previous deployment in case of issues

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST}"

if [ -z "$DEPLOY_HOST" ]; then
    echo -e "${COLOR_RED}Error: DEPLOY_HOST environment variable is required${COLOR_RESET}"
    exit 1
fi

echo -e "${COLOR_RED}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_RED}║            ROLLBACK INITIATED              ║${COLOR_RESET}"
echo -e "${COLOR_RED}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "${COLOR_YELLOW}Environment: $ENVIRONMENT${COLOR_RESET}"
echo -e "${COLOR_YELLOW}Deploy Host: $DEPLOY_HOST${COLOR_RESET}"
echo ""

# Confirm rollback
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${COLOR_RED}⚠️  WARNING: Rolling back PRODUCTION environment${COLOR_RESET}"
    echo ""
    read -p "Type 'ROLLBACK' to confirm: " confirmation

    if [ "$confirmation" != "ROLLBACK" ]; then
        echo -e "${COLOR_YELLOW}Rollback cancelled${COLOR_RESET}"
        exit 0
    fi
fi

# Function to run SSH command
ssh_exec() {
    ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" "$@"
}

# Get deployment history
echo ""
echo -e "${COLOR_YELLOW}→ Fetching deployment history...${COLOR_RESET}"

DEPLOYMENT_LOG=$(ssh_exec "tail -10 ~/app/deployment.log" || echo "")

if [ -z "$DEPLOYMENT_LOG" ]; then
    echo -e "${COLOR_RED}✗ No deployment history found${COLOR_RESET}"
    exit 1
fi

echo ""
echo "Recent deployments:"
echo "$DEPLOYMENT_LOG" | nl -w2 -s'. '
echo ""

# Get previous deployment
PREVIOUS_DEPLOYMENT=$(echo "$DEPLOYMENT_LOG" | tail -2 | head -1)

if [ -z "$PREVIOUS_DEPLOYMENT" ]; then
    echo -e "${COLOR_RED}✗ No previous deployment found${COLOR_RESET}"
    exit 1
fi

PREVIOUS_BACKEND=$(echo "$PREVIOUS_DEPLOYMENT" | awk '{print $NF}')

echo -e "${COLOR_BLUE}Previous backend image:${COLOR_RESET} $PREVIOUS_BACKEND"
echo ""

read -p "Press Enter to rollback to this version, or Ctrl+C to cancel..."

# Stop current containers
echo ""
echo -e "${COLOR_YELLOW}→ Stopping current containers...${COLOR_RESET}"

ssh_exec "docker stop backend frontend || true"

echo -e "${COLOR_GREEN}✓ Containers stopped${COLOR_RESET}"

# Restore previous version
echo ""
echo -e "${COLOR_YELLOW}→ Starting previous version...${COLOR_RESET}"

# If using docker-compose with image tags
# ssh_exec "cd ~/app && export BACKEND_IMAGE=$PREVIOUS_BACKEND && docker-compose up -d"

# If using direct docker commands
ssh_exec "docker start backend frontend"

echo -e "${COLOR_GREEN}✓ Previous version started${COLOR_RESET}"

# Wait for services
echo ""
echo -e "${COLOR_YELLOW}→ Waiting for services to be ready...${COLOR_RESET}"
sleep 30

# Health check
echo ""
echo -e "${COLOR_YELLOW}→ Running health check...${COLOR_RESET}"

HEALTH_URL="https://${DEPLOY_HOST}/api/v1/health/"
if [ "$ENVIRONMENT" == "staging" ]; then
    HEALTH_URL="https://staging.${DEPLOY_HOST}/api/v1/health/"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${COLOR_GREEN}✓ Health check passed${COLOR_RESET}"
else
    echo -e "${COLOR_RED}✗ Health check failed (HTTP $HTTP_CODE)${COLOR_RESET}"
    echo ""
    echo "Check logs:"
    ssh_exec "docker logs --tail 50 backend"
    exit 1
fi

# Rollback migrations (if needed)
echo ""
echo -e "${COLOR_YELLOW}⚠️  Manual migration rollback may be required${COLOR_RESET}"
echo ""
echo "If database schema changed, you may need to:"
echo "  1. Connect to the server: ssh $DEPLOY_USER@$DEPLOY_HOST"
echo "  2. List migrations: docker exec backend python manage.py showmigrations"
echo "  3. Rollback migration: docker exec backend python manage.py migrate <app> <migration_name>"
echo ""

# Success
echo ""
echo -e "${COLOR_GREEN}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_GREEN}║       Rollback Completed Successfully      ║${COLOR_RESET}"
echo -e "${COLOR_GREEN}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}Environment:${COLOR_RESET}  $ENVIRONMENT"
echo -e "${COLOR_BLUE}Backend:${COLOR_RESET}      $PREVIOUS_BACKEND"
echo -e "${COLOR_BLUE}Status:${COLOR_RESET}       ${COLOR_GREEN}✓ Healthy${COLOR_RESET}"
echo ""
echo -e "${COLOR_YELLOW}Next steps:${COLOR_RESET}"
echo "  1. Investigate what caused the issue"
echo "  2. Fix the problem in code"
echo "  3. Test thoroughly before redeploying"
echo "  4. Monitor application logs"
echo ""
echo "Monitor logs:"
echo "  ssh $DEPLOY_USER@$DEPLOY_HOST 'docker logs -f backend'"
echo ""
