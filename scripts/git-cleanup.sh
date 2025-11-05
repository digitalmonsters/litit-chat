#!/bin/bash

# Git Branch Cleanup Script
# Automatically cleans up merged feature/fix/hotfix branches
# Usage: ./scripts/git-cleanup.sh [branch-name]

set -e

# Colors for output
RED='\033[0;31m'
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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository"
    exit 1
fi

# Ensure we're on develop branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    print_warning "Not on develop branch. Switching to develop..."
    git checkout develop
fi

# Update develop branch
print_info "Updating develop branch..."
git pull origin develop

# Function to clean up a specific branch
cleanup_branch() {
    local BRANCH=$1
    
    if [ -z "$BRANCH" ]; then
        print_error "Branch name required"
        return 1
    fi
    
    # Check if branch exists
    if ! git show-ref --verify --quiet refs/heads/$BRANCH; then
        print_error "Branch '$BRANCH' does not exist locally"
        return 1
    fi
    
    # Check if branch is merged
    if git branch --merged develop | grep -q "^.*$BRANCH$"; then
        print_info "Branch '$BRANCH' is merged. Cleaning up..."
        
        # Delete local branch
        git branch -d $BRANCH
        print_success "Deleted local branch: $BRANCH"
        
        # Try to delete remote branch
        if git show-ref --verify --quiet refs/remotes/origin/$BRANCH; then
            print_info "Deleting remote branch: origin/$BRANCH"
            if git push origin --delete $BRANCH 2>/dev/null; then
                print_success "Deleted remote branch: origin/$BRANCH"
            else
                print_warning "Could not delete remote branch (may not exist or permissions issue)"
            fi
        fi
        
        return 0
    else
        print_warning "Branch '$BRANCH' is not fully merged. Use -D to force delete."
        return 1
    fi
}

# If branch name provided, clean up that branch
if [ $# -gt 0 ]; then
    cleanup_branch $1
    exit $?
fi

# Otherwise, find and clean up all merged feature/fix/hotfix branches
print_info "Finding merged feature/fix/hotfix branches..."

MERGED_BRANCHES=$(git branch --merged develop | grep -E '^\s*(feature|fix|hotfix)/' | sed 's/^[ *]*//')

if [ -z "$MERGED_BRANCHES" ]; then
    print_info "No merged feature branches found"
    exit 0
fi

echo ""
print_info "Found merged branches:"
echo "$MERGED_BRANCHES" | while read branch; do
    echo "  - $branch"
done
echo ""

read -p "Delete these branches? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$MERGED_BRANCHES" | while read branch; do
        cleanup_branch $branch || true
    done
    print_success "Cleanup complete!"
else
    print_info "Cleanup cancelled"
fi

