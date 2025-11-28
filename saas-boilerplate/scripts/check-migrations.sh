#!/bin/bash
#
# Database Migration Safety Check Script
# Analyzes Django migrations for potentially dangerous operations
#
# Usage:
#   ./scripts/check-migrations.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Django Migration Safety Check ===${NC}\n"

# Change to backend directory
cd "$(dirname "$0")/../backend"

# Check for unapplied migrations
echo -e "${YELLOW}Checking for unapplied migrations...${NC}"
UNAPPLIED=$(python manage.py showmigrations --plan | grep "\[ \]" | wc -l)

if [ "$UNAPPLIED" -eq 0 ]; then
    echo -e "${GREEN}✓ No unapplied migrations${NC}\n"
else
    echo -e "${YELLOW}⚠ Found $UNAPPLIED unapplied migration(s)${NC}"
    python manage.py showmigrations --plan | grep "\[ \]"
    echo ""
fi

# Check for potentially dangerous operations
echo -e "${YELLOW}Scanning migrations for dangerous operations...${NC}\n"

WARNINGS=0
ERRORS=0

# Find all recent migration files (last 10)
MIGRATION_FILES=$(find apps/*/migrations -name "*.py" -not -name "__init__.py" -type f | sort | tail -20)

for file in $MIGRATION_FILES; do
    # Check for dangerous operations
    
    # 1. Check for RemoveField (data loss)
    if grep -q "RemoveField\|DeleteModel" "$file"; then
        echo -e "${RED}✗ DANGER: Data loss operation in $file${NC}"
        grep -n "RemoveField\|DeleteModel" "$file" | head -3
        ERRORS=$((ERRORS + 1))
        echo ""
    fi
    
    # 2. Check for AlterField without migrations
    if grep -q "AlterField.*null=False" "$file"; then
        echo -e "${YELLOW}⚠ WARNING: NOT NULL constraint added in $file${NC}"
        echo "  Ensure existing NULL values are handled or add default value"
        WARNINGS=$((WARNINGS + 1))
        echo ""
    fi
    
    # 3. Check for AddField without default on non-nullable field
    if grep -q "AddField" "$file" && grep -q "null=False" "$file"; then
        if ! grep -q "default=" "$file"; then
            echo -e "${YELLOW}⚠ WARNING: Non-nullable field without default in $file${NC}"
            echo "  This may fail on existing rows"
            WARNINGS=$((WARNINGS + 1))
            echo ""
        fi
    fi
    
    # 4. Check for AddIndex on large tables (potential lock)
    if grep -q "AddIndex" "$file"; then
        echo -e "${YELLOW}⚠ INFO: Index creation in $file${NC}"
        echo "  Large tables may experience locks during index creation"
        echo "  Consider using CREATE INDEX CONCURRENTLY in PostgreSQL"
        echo ""
    fi
    
    # 5. Check for RunPython/RunSQL (requires review)
    if grep -q "RunPython\|RunSQL" "$file"; then
        echo -e "${YELLOW}⚠ WARNING: Custom migration code in $file${NC}"
        echo "  Review custom Python/SQL code for safety"
        WARNINGS=$((WARNINGS + 1))
        echo ""
    fi
    
    # 6. Check for RenameField/RenameModel (potential downtime)
    if grep -q "RenameField\|RenameModel" "$file"; then
        echo -e "${YELLOW}⚠ INFO: Rename operation in $file${NC}"
        echo "  Requires careful deployment to avoid downtime"
        echo ""
    fi
done

# Summary
echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

if [ "$ERRORS" -gt 0 ]; then
    echo -e "\n${RED}✗ Migration safety check FAILED${NC}"
    echo -e "${RED}Review and fix errors before deploying to production${NC}"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "\n${YELLOW}⚠ Migration safety check passed with WARNINGS${NC}"
    echo -e "${YELLOW}Review warnings and plan deployment carefully${NC}"
    exit 0
else
    echo -e "\n${GREEN}✓ Migration safety check PASSED${NC}"
    exit 0
fi
