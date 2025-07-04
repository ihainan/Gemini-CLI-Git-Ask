#!/bin/bash

# Real Integration Tests Runner
# Provides multiple ways to configure and run real integration tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Real Integration Tests Runner${NC}"
echo "================================================"

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [OPTIONS]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --help, -h           Show this help message"
    echo "  --config-file FILE   Use specific config file (default: test.env)"
    echo "  --no-config-file     Use only environment variables"
    echo "  --model MODEL        Gemini model to use (default: gemini-2.5-flash)"
    echo "  --timeout TIMEOUT    Test timeout in milliseconds (default: 60000)"
    echo "  --cleanup            Enable cleanup after tests"
    echo "  --no-cleanup         Disable cleanup after tests"
    echo "  --verbose            Run with verbose output"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0                                    # Use test.env if exists, otherwise env vars"
    echo "  $0 --no-config-file                  # Use only environment variables"
    echo "  $0 --config-file my-test.env         # Use specific config file"
    echo "  $0 --model gemini-2.5-pro --cleanup # Override specific settings"
    echo ""
    echo -e "${YELLOW}Prerequisites:${NC}"
    echo "  1. Gemini CLI installed: npm install -g @google/gemini-cli"
    echo "  2. Git installed"
    echo "  3. Network access to GitHub"
}

# Default values
CONFIG_FILE="test.env"
USE_CONFIG_FILE=true
GEMINI_MODEL=""
TEST_TIMEOUT=""
CLEANUP=""
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_usage
            exit 0
            ;;
        --config-file)
            CONFIG_FILE="$2"
            USE_CONFIG_FILE=true
            shift 2
            ;;
        --no-config-file)
            USE_CONFIG_FILE=false
            shift
            ;;
        --model)
            GEMINI_MODEL="$2"
            shift 2
            ;;
        --timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        --cleanup)
            CLEANUP="true"
            shift
            ;;
        --no-cleanup)
            CLEANUP="false"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Navigate to service directory (where package.json is located)
cd "$(dirname "$0")/../.."

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check if gemini CLI is available
if ! command -v gemini &> /dev/null; then
    echo -e "${RED}❌ Gemini CLI not found!${NC}"
    echo "Please install it: npm install -g @google/gemini-cli"
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found!${NC}"
    echo "Please install Git."
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites satisfied${NC}"

# Load configuration
echo -e "${BLUE}📋 Loading configuration...${NC}"

# Set required environment variable
export REAL_INTEGRATION_ENABLED=true

if [[ "$USE_CONFIG_FILE" == true && -f "tests/real-integration/$CONFIG_FILE" ]]; then
    echo -e "${GREEN}📄 Loading config from: tests/real-integration/$CONFIG_FILE${NC}"
    set -a  # Automatically export all variables
    source "tests/real-integration/$CONFIG_FILE"
    set +a
else
    if [[ "$USE_CONFIG_FILE" == true ]]; then
        echo -e "${YELLOW}⚠️  Config file tests/real-integration/$CONFIG_FILE not found${NC}"
    fi
    echo -e "${BLUE}🔧 Using environment variables and defaults${NC}"
fi

# Override with command line arguments
if [[ -n "$GEMINI_MODEL" ]]; then
    export GEMINI_MODEL="$GEMINI_MODEL"
fi

if [[ -n "$TEST_TIMEOUT" ]]; then
    export TEST_TIMEOUT="$TEST_TIMEOUT"
fi

if [[ -n "$CLEANUP" ]]; then
    export REAL_INTEGRATION_CLEANUP="$CLEANUP"
fi

# Set defaults if not specified
export GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"
export TEST_TIMEOUT="${TEST_TIMEOUT:-60000}"
export REAL_INTEGRATION_CLEANUP="${REAL_INTEGRATION_CLEANUP:-false}"

# Show configuration
echo -e "${BLUE}📊 Configuration:${NC}"
echo "  Model: $GEMINI_MODEL"
echo "  Timeout: $TEST_TIMEOUT ms"
echo "  Cleanup: $REAL_INTEGRATION_CLEANUP"
echo ""

# Build Jest command
JEST_CMD="npm run test:real-integration"
if [[ "$VERBOSE" == true ]]; then
    JEST_CMD="$JEST_CMD -- --verbose"
fi

# Run tests
echo -e "${BLUE}🚀 Running real integration tests...${NC}"
echo "Command: $JEST_CMD"
echo ""

exec $JEST_CMD 