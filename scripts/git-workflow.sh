#!/bin/bash

# Git Workflow Helper Script
# Quick shortcuts for common git operations following Lit.it workflow

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check arguments
if [ $# -lt 1 ]; then
    echo "Git Workflow Helper"
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  feature <name>     Create and checkout new feature branch"
    echo "  fix <name>         Create and checkout new fix branch"
    echo "  hotfix <name>      Create and checkout new hotfix branch"
    echo "  merge-dev <source> [summary]  Merge feature/fix into develop"
    echo "  merge-staging [summary]       Merge develop into staging"
    echo "  merge-main [summary]          Merge staging into main"
    echo "  cleanup            Clean up merged branches"
    echo "  cleanup <branch>   Clean up specific merged branch"
    echo ""
    exit 0
fi

COMMAND=$1
shift

case "$COMMAND" in
    "feature"|"fix"|"hotfix")
        if [ -z "$1" ]; then
            echo "Error: Branch name required"
            echo "Usage: $0 $COMMAND <branch-name>"
            exit 1
        fi
        
        BRANCH_NAME=$1
        BRANCH="$COMMAND/$BRANCH_NAME"
        
        # Ensure we're on develop (except for hotfix)
        if [ "$COMMAND" != "hotfix" ]; then
            CURRENT_BRANCH=$(git branch --show-current)
            if [ "$CURRENT_BRANCH" != "develop" ]; then
                print_info "Switching to develop branch..."
                git checkout develop
                git pull origin develop
            fi
        else
            # Hotfix branches should be created from main
            CURRENT_BRANCH=$(git branch --show-current)
            if [ "$CURRENT_BRANCH" != "main" ]; then
                print_info "Switching to main branch..."
                git checkout main
                git pull origin main
            fi
        fi
        
        print_info "Creating branch: $BRANCH"
        git checkout -b $BRANCH
        print_success "Created and checked out: $BRANCH"
        ;;
        
    "merge-dev")
        SOURCE=$1
        SUMMARY=$2
        
        if [ -z "$SOURCE" ]; then
            echo "Error: Source branch required"
            echo "Usage: $0 merge-dev <source-branch> [summary]"
            exit 1
        fi
        
        ./scripts/git-merge.sh "$SOURCE" develop "$SUMMARY"
        ;;
        
    "merge-staging")
        SUMMARY=$1
        ./scripts/git-merge.sh develop staging "$SUMMARY"
        ;;
        
    "merge-main")
        SUMMARY=$1
        ./scripts/git-merge.sh staging main "$SUMMARY"
        ;;
        
    "cleanup")
        if [ -z "$1" ]; then
            ./scripts/git-cleanup.sh
        else
            ./scripts/git-cleanup.sh "$1"
        fi
        ;;
        
    *)
        echo "Unknown command: $COMMAND"
        echo "Run '$0' without arguments to see usage"
        exit 1
        ;;
esac

