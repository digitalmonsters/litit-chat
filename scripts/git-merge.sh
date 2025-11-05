#!/bin/bash

# Git Merge Script for Lit.it
# Handles merging between develop, staging, and main branches
# Usage: ./scripts/git-merge.sh <source> <target> [summary]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Validate arguments
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <source-branch> <target-branch> [summary]"
    echo ""
    echo "Examples:"
    echo "  $0 develop staging 'Monetization integration complete'"
    echo "  $0 staging main 'Ready for production release v1.0'"
    exit 1
fi

SOURCE_BRANCH=$1
TARGET_BRANCH=$2
SUMMARY=${3:-""}

# Validate branch names
VALID_TARGETS=("develop" "staging" "main")
VALID_SOURCES=("develop" "staging" "feature" "fix" "hotfix")

# Check if target is valid
if [[ ! " ${VALID_TARGETS[@]} " =~ " ${TARGET_BRANCH} " ]]; then
    print_error "Invalid target branch: $TARGET_BRANCH"
    print_info "Valid targets: ${VALID_TARGETS[*]}"
    exit 1
fi

# Check merge flow rules
case "$TARGET_BRANCH" in
    "staging")
        if [ "$SOURCE_BRANCH" != "develop" ]; then
            print_error "Staging can only be merged from 'develop'"
            exit 1
        fi
        ;;
    "main")
        if [ "$SOURCE_BRANCH" != "staging" ]; then
            print_error "Main can only be merged from 'staging'"
            exit 1
        fi
        ;;
    "develop")
        if [[ ! "$SOURCE_BRANCH" =~ ^(feature|fix|hotfix)/ ]]; then
            print_warning "Warning: Merging non-feature branch into develop"
        fi
        ;;
esac

# Check if branches exist
if ! git show-ref --verify --quiet refs/heads/$SOURCE_BRANCH; then
    print_error "Source branch '$SOURCE_BRANCH' does not exist locally"
    exit 1
fi

if ! git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
    print_error "Target branch '$TARGET_BRANCH' does not exist locally"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Switch to target branch
print_info "Switching to target branch: $TARGET_BRANCH"
git checkout $TARGET_BRANCH

# Pull latest changes
print_info "Pulling latest changes from origin/$TARGET_BRANCH"
if ! git pull origin $TARGET_BRANCH; then
    print_error "Failed to pull latest changes"
    exit 1
fi

# Ensure source branch is up to date
print_info "Updating source branch: $SOURCE_BRANCH"
git checkout $SOURCE_BRANCH
if ! git pull origin $SOURCE_BRANCH 2>/dev/null; then
    print_warning "Source branch not on remote, continuing with local branch"
fi
git checkout $TARGET_BRANCH

# Perform merge with --no-ff
print_info "Merging $SOURCE_BRANCH into $TARGET_BRANCH..."

if [ -z "$SUMMARY" ]; then
    MERGE_MESSAGE="Merge branch '$SOURCE_BRANCH' into $TARGET_BRANCH"
else
    MERGE_MESSAGE="Merge branch '$SOURCE_BRANCH' into $TARGET_BRANCH - $SUMMARY"
fi

if git merge --no-ff -m "$MERGE_MESSAGE" $SOURCE_BRANCH; then
    print_success "Merge completed successfully"
else
    print_error "Merge failed. Please resolve conflicts manually."
    exit 1
fi

# Push to remote
print_info "Pushing to origin/$TARGET_BRANCH"
if git push origin $TARGET_BRANCH; then
    print_success "Pushed to remote successfully"
else
    print_error "Failed to push to remote"
    exit 1
fi

# Summary
echo ""
print_success "Merge complete!"
echo "  Source: $SOURCE_BRANCH"
echo "  Target: $TARGET_BRANCH"
echo "  Summary: ${SUMMARY:-'(none)'}"
echo ""

# If merging feature branch into develop, suggest cleanup
if [[ "$SOURCE_BRANCH" =~ ^(feature|fix|hotfix)/ ]] && [ "$TARGET_BRANCH" == "develop" ]; then
    print_info "Feature branch merged. You can clean it up with:"
    echo "  ./scripts/git-cleanup.sh $SOURCE_BRANCH"
fi
