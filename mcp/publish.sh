#!/bin/bash

# Git Ask MCP Server NPM Publishing Script
# Usage: ./publish.sh [dry-run|publish]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}🔵 $1${NC}"
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

MODE=${1:-dry-run}

echo "🚀 Git Ask MCP Server Publishing"
echo "================================="
echo

# Check npm login
print_step "Checking NPM authentication"
if ! npm whoami > /dev/null 2>&1; then
    print_warning "Not logged in to NPM"
    echo "Please run: npm login"
    if [[ "$MODE" == "publish" ]]; then
        exit 1
    fi
else
    NPM_USER=$(npm whoami)
    print_success "NPM user: $NPM_USER"
fi

# Check package name availability
print_step "Checking package name availability"
if npm view git-ask-mcp-server > /dev/null 2>&1; then
    print_error "Package name 'git-ask-mcp-server' already exists"
    exit 1
else
    print_success "Package name 'git-ask-mcp-server' is available"
fi

# Build and test
print_step "Building and testing"
npm run clean > /dev/null
npm run build > /dev/null
print_success "Build completed successfully"

# Check package contents
print_step "Package contents"
PACKAGE_SIZE=$(npm pack --dry-run 2>/dev/null | grep "package size" | awk '{print $4, $5}')
print_success "Package size: $PACKAGE_SIZE"

# Version info
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: v$CURRENT_VERSION"

if [[ "$MODE" == "dry-run" ]]; then
    print_warning "Dry run mode - package will not be published"
    echo
    echo "To publish, run: $0 publish"
    echo "Or use: npm publish"
    exit 0
fi

# Publish
print_step "Publishing to NPM"
echo "Package: git-ask-mcp-server@$CURRENT_VERSION"
echo

read -p "Confirm publish? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Publishing cancelled"
    exit 0
fi

if npm publish; then
    print_success "Published successfully!"
    echo
    echo "🎉 Your package is now available on NPM"
    echo
    echo "Users can install with:"
    echo "  npx -y git-ask-mcp-server"
    echo "  npm install -g git-ask-mcp-server"
else
    print_error "Publishing failed"
    exit 1
fi 