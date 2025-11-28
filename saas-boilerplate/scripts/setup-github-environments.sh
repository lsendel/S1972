#!/bin/bash
set -e

# Setup GitHub Environments Script
# This script helps configure GitHub environments for CI/CD deployment
# Requires: GitHub CLI (gh)

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║  GitHub Environments Setup Script         ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${COLOR_RED}✗ GitHub CLI (gh) is not installed${COLOR_RESET}"
    echo ""
    echo "Please install it first:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   See https://cli.github.com/manual/installation"
    echo "  Windows: See https://cli.github.com/manual/installation"
    exit 1
fi

echo -e "${COLOR_GREEN}✓ GitHub CLI found${COLOR_RESET}"

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${COLOR_YELLOW}⚠ Not authenticated with GitHub${COLOR_RESET}"
    echo ""
    echo "Running: gh auth login"
    gh auth login
fi

echo -e "${COLOR_GREEN}✓ Authenticated with GitHub${COLOR_RESET}"
echo ""

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "${COLOR_BLUE}Repository: ${REPO}${COLOR_RESET}"
echo ""

# Function to create or update environment
create_environment() {
    local env_name=$1
    local description=$2

    echo -e "${COLOR_YELLOW}Setting up environment: ${env_name}${COLOR_RESET}"

    # Note: GitHub CLI doesn't have direct environment creation commands
    # We'll provide instructions instead

    echo ""
    echo "  Manual steps required (GitHub CLI doesn't support environment creation yet):"
    echo ""
    echo "  1. Go to: https://github.com/${REPO}/settings/environments"
    echo "  2. Click 'New environment'"
    echo "  3. Name: ${env_name}"
    echo "  4. Configure protection rules as described below"
    echo ""
}

echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_BLUE}Creating Staging Environment${COLOR_RESET}"
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo ""

create_environment "staging" "Staging environment for testing"

echo "  Protection Rules for STAGING:"
echo "  ✓ Required reviewers: None (auto-deploy)"
echo "  ✓ Wait timer: 0 minutes"
echo "  ✓ Deployment branches: develop, main"
echo ""
echo "  Environment URL:"
echo "    https://staging.example.com"
echo ""
echo "  Secrets to add (see .github/SECRETS_TEMPLATE.md):"
echo "    • DATABASE_URL"
echo "    • REDIS_URL"
echo "    • DJANGO_SECRET_KEY"
echo "    • FIELD_ENCRYPTION_KEY"
echo "    • STRIPE_SECRET_KEY (test mode)"
echo "    • EMAIL_HOST_PASSWORD"
echo "    • DEPLOY_SSH_KEY"
echo "    • ... (see full list in SECRETS_TEMPLATE.md)"
echo ""

read -p "Press Enter once staging environment is created..."

echo ""
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_BLUE}Creating Production Environment${COLOR_RESET}"
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo ""

create_environment "production" "Production environment"

echo "  Protection Rules for PRODUCTION:"
echo "  ${COLOR_RED}✓ Required reviewers: YES - Add team members${COLOR_RESET}"
echo "  ✓ Wait timer: 5 minutes (optional, allows cancellation)"
echo "  ${COLOR_RED}✓ Deployment branches: main ONLY${COLOR_RESET}"
echo "  ✓ Prevent self-review: Recommended"
echo ""
echo "  Environment URL:"
echo "    https://example.com"
echo ""
echo "  Secrets to add (see .github/SECRETS_TEMPLATE.md):"
echo "    • DATABASE_URL (production credentials)"
echo "    • REDIS_URL (production credentials)"
echo "    • DJANGO_SECRET_KEY (DIFFERENT from staging)"
echo "    • FIELD_ENCRYPTION_KEY (DIFFERENT from staging)"
echo "    • STRIPE_SECRET_KEY (LIVE mode)"
echo "    • EMAIL_HOST_PASSWORD (production SMTP)"
echo "    • DEPLOY_SSH_KEY (production server)"
echo "    • SENTRY_DSN (recommended)"
echo "    • ... (see full list in SECRETS_TEMPLATE.md)"
echo ""

read -p "Press Enter once production environment is created..."

echo ""
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_BLUE}Additional Repository Configuration${COLOR_RESET}"
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo ""

echo "Enable the following in repository settings:"
echo ""
echo "Security & Analysis:"
echo "  ✓ Dependency graph"
echo "  ✓ Dependabot alerts"
echo "  ✓ Dependabot security updates"
echo "  ✓ Secret scanning"
echo "  ✓ Push protection (prevents secret commits)"
echo ""
echo "Go to: https://github.com/${REPO}/settings/security_analysis"
echo ""

read -p "Press Enter once security features are enabled..."

echo ""
echo "Actions Permissions:"
echo "  ✓ Allow all actions and reusable workflows"
echo "  ✓ Workflow permissions: Read and write"
echo "  ✓ Allow GitHub Actions to create PRs"
echo ""
echo "Go to: https://github.com/${REPO}/settings/actions"
echo ""

read -p "Press Enter once Actions permissions are configured..."

echo ""
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_BLUE}Repository Secrets${COLOR_RESET}"
echo -e "${COLOR_BLUE}════════════════════════════════════════════${COLOR_RESET}"
echo ""

echo "Optional repository secrets:"
echo ""
echo "  • CODECOV_TOKEN (for code coverage reports)"
echo "  • GH_APP_ID (for enhanced GitHub API access)"
echo "  • GH_APP_PRIVATE_KEY (GitHub App authentication)"
echo ""
echo "Go to: https://github.com/${REPO}/settings/secrets/actions"
echo ""

read -p "Press Enter once repository secrets are added (or skip)..."

echo ""
echo -e "${COLOR_GREEN}════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_GREEN}✓ Setup Instructions Completed!${COLOR_RESET}"
echo -e "${COLOR_GREEN}════════════════════════════════════════════${COLOR_RESET}"
echo ""
echo "Next steps:"
echo ""
echo "1. Generate and add secrets to environments"
echo "   See: .github/SECRETS_TEMPLATE.md"
echo ""
echo "2. Test the pipeline with a pull request"
echo "   git checkout -b test/ci-pipeline"
echo "   git commit --allow-empty -m 'test: CI pipeline'"
echo "   git push -u origin test/ci-pipeline"
echo "   gh pr create"
echo ""
echo "3. Verify workflows run successfully"
echo "   https://github.com/${REPO}/actions"
echo ""
echo "4. Update deployment commands in .github/workflows/deploy.yml"
echo "   Replace TODO comments with actual deployment commands"
echo ""
echo "5. Review CI/CD documentation"
echo "   cat CI_CD.md"
echo ""
echo -e "${COLOR_GREEN}Happy deploying! 🚀${COLOR_RESET}"
echo ""
