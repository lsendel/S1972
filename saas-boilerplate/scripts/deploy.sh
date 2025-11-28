#!/bin/bash
set -e

# Deployment Script Template
# This script should be customized for your specific deployment infrastructure
# It can be called from GitHub Actions deploy.yml workflow

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
BACKEND_IMAGE="${2}"
FRONTEND_IMAGE="${3}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST}"

# Validate inputs
if [ -z "$BACKEND_IMAGE" ] || [ -z "$FRONTEND_IMAGE" ]; then
    echo -e "${COLOR_RED}Error: Backend and frontend images are required${COLOR_RESET}"
    echo "Usage: $0 <environment> <backend-image> <frontend-image>"
    exit 1
fi

if [ -z "$DEPLOY_HOST" ]; then
    echo -e "${COLOR_RED}Error: DEPLOY_HOST environment variable is required${COLOR_RESET}"
    exit 1
fi

echo -e "${COLOR_BLUE}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║         Deployment Script                  ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}Environment:${COLOR_RESET}     $ENVIRONMENT"
echo -e "${COLOR_BLUE}Backend Image:${COLOR_RESET}   $BACKEND_IMAGE"
echo -e "${COLOR_BLUE}Frontend Image:${COLOR_RESET}  $FRONTEND_IMAGE"
echo -e "${COLOR_BLUE}Deploy Host:${COLOR_RESET}     $DEPLOY_HOST"
echo ""

# Function to run SSH command
ssh_exec() {
    ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" "$@"
}

# Function to run SCP
scp_file() {
    scp -o StrictHostKeyChecking=no "$@" "$DEPLOY_USER@$DEPLOY_HOST:"
}

# Test SSH connection
echo -e "${COLOR_YELLOW}→ Testing SSH connection...${COLOR_RESET}"
if ssh_exec "echo 'SSH connection successful'"; then
    echo -e "${COLOR_GREEN}✓ SSH connection verified${COLOR_RESET}"
else
    echo -e "${COLOR_RED}✗ SSH connection failed${COLOR_RESET}"
    exit 1
fi

# Create backup (production only)
if [ "$ENVIRONMENT" == "production" ]; then
    echo ""
    echo -e "${COLOR_YELLOW}→ Creating database backup...${COLOR_RESET}"

    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"

    ssh_exec "docker-compose exec -T db pg_dump -U \$DB_USER \$DB_NAME > ~/backups/$BACKUP_FILE"
    ssh_exec "gzip ~/backups/$BACKUP_FILE"

    echo -e "${COLOR_GREEN}✓ Backup created: $BACKUP_FILE.gz${COLOR_RESET}"
fi

# Pull latest images
echo ""
echo -e "${COLOR_YELLOW}→ Pulling container images...${COLOR_RESET}"

ssh_exec "echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin"
ssh_exec "docker pull $BACKEND_IMAGE"
ssh_exec "docker pull $FRONTEND_IMAGE"

echo -e "${COLOR_GREEN}✓ Images pulled successfully${COLOR_RESET}"

# Update docker-compose.yml or deployment config
echo ""
echo -e "${COLOR_YELLOW}→ Updating deployment configuration...${COLOR_RESET}"

# Option 1: Docker Compose deployment
# ssh_exec "cd ~/app && docker-compose down"
# ssh_exec "cd ~/app && export BACKEND_IMAGE=$BACKEND_IMAGE && export FRONTEND_IMAGE=$FRONTEND_IMAGE && docker-compose up -d"

# Option 2: Kubernetes deployment
# kubectl set image deployment/backend backend=$BACKEND_IMAGE
# kubectl set image deployment/frontend frontend=$FRONTEND_IMAGE

# Option 3: Direct Docker commands
ssh_exec "docker stop backend frontend || true"
ssh_exec "docker rm backend frontend || true"
ssh_exec "docker run -d --name backend --env-file ~/app/.env.backend -p 8000:8000 $BACKEND_IMAGE"
ssh_exec "docker run -d --name frontend -p 80:80 $FRONTEND_IMAGE"

echo -e "${COLOR_GREEN}✓ Containers updated${COLOR_RESET}"

# Run database migrations
echo ""
echo -e "${COLOR_YELLOW}→ Running database migrations...${COLOR_RESET}"

ssh_exec "docker exec backend python manage.py migrate --noinput"

echo -e "${COLOR_GREEN}✓ Migrations applied${COLOR_RESET}"

# Collect static files (if needed)
echo ""
echo -e "${COLOR_YELLOW}→ Collecting static files...${COLOR_RESET}"

ssh_exec "docker exec backend python manage.py collectstatic --noinput --clear"

echo -e "${COLOR_GREEN}✓ Static files collected${COLOR_RESET}"

# Restart application servers (if using gunicorn/uwsgi with reload)
echo ""
echo -e "${COLOR_YELLOW}→ Restarting application servers...${COLOR_RESET}"

# Option 1: Send HUP signal to gunicorn for graceful reload
# ssh_exec "docker exec backend pkill -HUP gunicorn"

# Option 2: Restart containers
# ssh_exec "docker restart backend frontend"

# Option 3: Kubernetes rolling update (already done by kubectl set image)
# kubectl rollout status deployment/backend
# kubectl rollout status deployment/frontend

echo -e "${COLOR_GREEN}✓ Application servers restarted${COLOR_RESET}"

# Wait for services to be ready
echo ""
echo -e "${COLOR_YELLOW}→ Waiting for services to be ready...${COLOR_RESET}"

if [ "$ENVIRONMENT" == "production" ]; then
    WAIT_TIME=60
else
    WAIT_TIME=30
fi

echo "  Waiting $WAIT_TIME seconds..."
sleep "$WAIT_TIME"

# Health check
echo ""
echo -e "${COLOR_YELLOW}→ Running health checks...${COLOR_RESET}"

HEALTH_URL="https://${DEPLOY_HOST}/api/v1/health/"
if [ "$ENVIRONMENT" == "staging" ]; then
    HEALTH_URL="https://staging.${DEPLOY_HOST}/api/v1/health/"
fi

MAX_ATTEMPTS=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${COLOR_GREEN}✓ Health check passed (HTTP $HTTP_CODE)${COLOR_RESET}"
        break
    fi

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${COLOR_RED}✗ Health check failed after $MAX_ATTEMPTS attempts (HTTP $HTTP_CODE)${COLOR_RESET}"

        # Show logs for debugging
        echo ""
        echo "Backend logs:"
        ssh_exec "docker logs --tail 50 backend"

        exit 1
    fi

    ATTEMPT=$((ATTEMPT + 1))
    sleep 5
done

# Additional smoke tests
if [ "$ENVIRONMENT" == "production" ]; then
    echo ""
    echo -e "${COLOR_YELLOW}→ Running additional smoke tests...${COLOR_RESET}"

    # Test readiness endpoint
    READY_URL="https://${DEPLOY_HOST}/api/v1/ready/"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$READY_URL" || echo "000")

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${COLOR_GREEN}✓ Readiness check passed${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}✗ Readiness check failed (HTTP $HTTP_CODE)${COLOR_RESET}"
        exit 1
    fi

    # Test frontend
    FRONTEND_URL="https://${DEPLOY_HOST}/"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${COLOR_GREEN}✓ Frontend check passed${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}✗ Frontend check failed (HTTP $HTTP_CODE)${COLOR_RESET}"
        exit 1
    fi
fi

# Clean up old images
echo ""
echo -e "${COLOR_YELLOW}→ Cleaning up old images...${COLOR_RESET}"

ssh_exec "docker image prune -af --filter 'until=72h'"

echo -e "${COLOR_GREEN}✓ Old images cleaned${COLOR_RESET}"

# Deployment summary
echo ""
echo -e "${COLOR_GREEN}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_GREEN}║    Deployment Completed Successfully!     ║${COLOR_RESET}"
echo -e "${COLOR_GREEN}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}Environment:${COLOR_RESET}    $ENVIRONMENT"
echo -e "${COLOR_BLUE}Backend:${COLOR_RESET}        $BACKEND_IMAGE"
echo -e "${COLOR_BLUE}Frontend:${COLOR_RESET}       $FRONTEND_IMAGE"
echo -e "${COLOR_BLUE}URL:${COLOR_RESET}            $HEALTH_URL"
echo -e "${COLOR_BLUE}Status:${COLOR_RESET}         ${COLOR_GREEN}✓ Healthy${COLOR_RESET}"
echo ""

# Log deployment
ssh_exec "echo '$(date +%Y-%m-%d\ %H:%M:%S) - $ENVIRONMENT - $BACKEND_IMAGE' >> ~/app/deployment.log"

echo -e "${COLOR_BLUE}Monitor logs:${COLOR_RESET}"
echo "  ssh $DEPLOY_USER@$DEPLOY_HOST 'docker logs -f backend'"
echo ""
echo -e "${COLOR_BLUE}Rollback command (if needed):${COLOR_RESET}"
echo "  ./scripts/rollback.sh $ENVIRONMENT"
echo ""
