#!/bin/bash

# GitHub-Local Repository Synchronization Script
# This script helps synchronize local repository with GitHub remote
# Based on: docs/operations/GITHUB_LOCAL_SYNC_PROPOSAL.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh" 2>/dev/null || {
    # Fallback logging if common-functions.sh not available
    log_info() { echo "[INFO] $1"; }
    log_success() { echo "[SUCCESS] $1"; }
    log_warning() { echo "[WARNING] $1"; }
    log_error() { echo "[ERROR] $1"; }
}

REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "================================================================"
echo "  GitHub-Local Repository Synchronization"
echo "  Repository: $(basename "$REPO_ROOT")"
echo "================================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check git status
check_git_status() {
    log_info "Checking git status..."
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes"
        git status --short
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Aborted by user"
            exit 0
        fi
    fi
}

# Function to check untracked files
check_untracked_files() {
    log_info "Checking for untracked files..."
    
    local untracked=$(git ls-files --others --exclude-standard)
    if [ -n "$untracked" ]; then
        log_warning "Found untracked files:"
        echo "$untracked" | sed 's/^/  - /'
        echo ""
        read -p "Review untracked files? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$untracked" | while read -r file; do
                echo ""
                echo "File: $file"
                read -p "Action: (a)dd, (r)emove, (s)kip: " -n 1 -r action
                echo ""
                case $action in
                    a|A)
                        git add "$file"
                        log_success "Added $file"
                        ;;
                    r|R)
                        rm -i "$file"
                        log_success "Removed $file"
                        ;;
                    s|S)
                        log_info "Skipped $file"
                        ;;
                esac
            done
        fi
    else
        log_success "No untracked files"
    fi
}

# Function to check local vs remote
check_sync_status() {
    log_info "Checking synchronization status..."
    
    # Fetch latest from remote
    git fetch origin --prune > /dev/null 2>&1 || {
        log_error "Failed to fetch from origin"
        exit 1
    }
    
    local ahead=$(git rev-list --count origin/master..HEAD 2>/dev/null || echo "0")
    local behind=$(git rev-list --count HEAD..origin/master 2>/dev/null || echo "0")
    
    if [ "$ahead" -gt 0 ] && [ "$behind" -eq 0 ]; then
        log_warning "Local is $ahead commit(s) ahead of remote"
        echo "  Commits to push:"
        git log --oneline origin/master..HEAD | sed 's/^/    /'
        return 1
    elif [ "$behind" -gt 0 ] && [ "$ahead" -eq 0 ]; then
        log_warning "Local is $behind commit(s) behind remote"
        echo "  Commits to pull:"
        git log --oneline HEAD..origin/master | sed 's/^/    /'
        return 2
    elif [ "$ahead" -gt 0 ] && [ "$behind" -gt 0 ]; then
        log_error "Branches have diverged!"
        echo "  Local commits:"
        git log --oneline origin/master..HEAD | sed 's/^/    /'
        echo "  Remote commits:"
        git log --oneline HEAD..origin/master | sed 's/^/    /'
        return 3
    else
        log_success "Local and remote are in sync"
        return 0
    fi
}

# Function to push local changes
push_to_remote() {
    log_info "Pushing to remote..."
    
    local branch=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$branch" != "master" ]; then
        log_warning "Current branch is '$branch', not 'master'"
        read -p "Push to '$branch' anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Aborted by user"
            return 1
        fi
    fi
    
    if git push origin "$branch"; then
        log_success "Successfully pushed to origin/$branch"
        return 0
    else
        log_error "Failed to push to remote"
        return 1
    fi
}

# Function to pull remote changes
pull_from_remote() {
    log_info "Pulling from remote..."
    
    local branch=$(git rev-parse --abbrev-ref HEAD)
    
    if git pull origin "$branch"; then
        log_success "Successfully pulled from origin/$branch"
        return 0
    else
        log_error "Failed to pull from remote"
        return 1
    fi
}

# Function to show remote branches
show_remote_branches() {
    log_info "Remote branches:"
    git branch -r | grep -v HEAD | sed 's/^  origin\///' | sed 's/^/  - /'
    echo ""
    log_info "Total: $(git branch -r | grep -v HEAD | wc -l | tr -d ' ') branches"
}

# Main execution
main() {
    check_git_status
    check_untracked_files
    
    local sync_status
    check_sync_status
    sync_status=$?
    
    case $sync_status in
        0)
            log_success "Repository is already synchronized"
            ;;
        1)
            echo ""
            read -p "Push local commits to remote? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                push_to_remote
            else
                log_info "Skipped push"
            fi
            ;;
        2)
            echo ""
            read -p "Pull remote commits? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                pull_from_remote
            else
                log_info "Skipped pull"
            fi
            ;;
        3)
            log_error "Branches have diverged. Manual intervention required."
            echo ""
            echo "Options:"
            echo "  1. Rebase: git rebase origin/master"
            echo "  2. Merge:  git merge origin/master"
            echo "  3. Abort and review manually"
            exit 1
            ;;
    esac
    
    # Show remote branches
    echo ""
    show_remote_branches
    
    # Final status
    echo ""
    log_info "Final status:"
    git status --short
    echo ""
    
    log_success "Synchronization check complete"
    echo ""
    echo "For detailed analysis, see: docs/operations/GITHUB_LOCAL_SYNC_PROPOSAL.md"
}

# Run main function
main "$@"

