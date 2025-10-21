#!/bin/bash

# DEVLAB Microservice Deployment Script
# This script automates the deployment process for both frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 20+"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run frontend tests
    if [ -d "frontend" ]; then
        print_status "Running frontend tests..."
        cd frontend
        npm run test:ci
        cd ..
    fi
    
    # Run backend tests
    if [ -d "backend" ]; then
        print_status "Running backend tests..."
        cd backend
        npm run test:ci
        cd ..
    fi
    
    print_success "All tests passed"
}

# Function to build applications
build_applications() {
    print_status "Building applications..."
    
    # Build frontend
    if [ -d "frontend" ]; then
        print_status "Building frontend..."
        cd frontend
        npm run build
        cd ..
    fi
    
    # Build backend
    if [ -d "backend" ]; then
        print_status "Building backend..."
        cd backend
        npm run build
        cd ..
    fi
    
    print_success "Applications built successfully"
}

# Function to deploy to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if ! command_exists vercel; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    cd frontend
    
    # Check if already logged in to Vercel
    if ! vercel whoami >/dev/null 2>&1; then
        print_warning "Please log in to Vercel:"
        vercel login
    fi
    
    # Deploy to production
    vercel --prod --yes
    
    cd ..
    print_success "Frontend deployed to Vercel"
}

# Function to deploy to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    if ! command_exists railway; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    cd backend
    
    # Check if already logged in to Railway
    if ! railway whoami >/dev/null 2>&1; then
        print_warning "Please log in to Railway:"
        railway login
    fi
    
    # Deploy to production
    railway up --detach
    
    cd ..
    print_success "Backend deployed to Railway"
}

# Function to check deployment status
check_deployment() {
    print_status "Checking deployment status..."
    
    # Check if backend is running
    if [ -d "backend" ]; then
        cd backend
        if railway status >/dev/null 2>&1; then
            print_success "Backend is running on Railway"
        else
            print_warning "Backend deployment status unknown"
        fi
        cd ..
    fi
    
    # Check if frontend is running
    if [ -d "frontend" ]; then
        cd frontend
        if vercel ls >/dev/null 2>&1; then
            print_success "Frontend is deployed on Vercel"
        else
            print_warning "Frontend deployment status unknown"
        fi
        cd ..
    fi
}

# Function to show help
show_help() {
    echo "DEVLAB Microservice Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --frontend-only    Deploy only frontend to Vercel"
    echo "  --backend-only     Deploy only backend to Railway"
    echo "  --skip-tests       Skip running tests"
    echo "  --skip-build       Skip building applications"
    echo "  --check-only       Only check deployment status"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Full deployment"
    echo "  $0 --frontend-only          # Deploy only frontend"
    echo "  $0 --backend-only           # Deploy only backend"
    echo "  $0 --skip-tests             # Deploy without running tests"
}

# Main function
main() {
    local frontend_only=false
    local backend_only=false
    local skip_tests=false
    local skip_build=false
    local check_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --frontend-only)
                frontend_only=true
                shift
                ;;
            --backend-only)
                backend_only=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_status "Starting DEVLAB Microservice deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    if [ "$check_only" = true ]; then
        check_deployment
        exit 0
    fi
    
    # Install dependencies
    install_dependencies
    
    # Run tests (unless skipped)
    if [ "$skip_tests" = false ]; then
        run_tests
    fi
    
    # Build applications (unless skipped)
    if [ "$skip_build" = false ]; then
        build_applications
    fi
    
    # Deploy based on options
    if [ "$frontend_only" = true ]; then
        deploy_frontend
    elif [ "$backend_only" = true ]; then
        deploy_backend
    else
        # Deploy both
        deploy_frontend
        deploy_backend
    fi
    
    # Check deployment status
    check_deployment
    
    print_success "Deployment completed successfully!"
    print_status "Frontend: https://your-project.vercel.app"
    print_status "Backend: https://your-project.railway.app"
}

# Run main function with all arguments
main "$@"
