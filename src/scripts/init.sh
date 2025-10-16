#!/bin/bash

set -e

echo "🚀 Starting ProjectHub Initialization..."

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

# Function to check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    local missing_vars=()
    
    # Check for required variables
    if [[ -z "${DATABASE_URL}" ]]; then
        missing_vars+=("DATABASE_URL")
    fi
    
    if [[ -z "${AUTO_REGISTER_DOMAIN}" ]]; then
        missing_vars+=("AUTO_REGISTER_DOMAIN")
    fi
    
    if [[ -z "${ADMIN_USERS}" ]]; then
        missing_vars+=("ADMIN_USERS")
    fi
    
    if [[ -z "${OPENAI_API_KEY}" ]]; then
        missing_vars+=("OPENAI_API_KEY")
    fi
    
    if [[ -z "${GOOGLE_CLIENT_ID}" ]]; then
        missing_vars+=("GOOGLE_CLIENT_ID")
    fi
    
    if [[ -z "${GOOGLE_CLIENT_SECRET}" ]]; then
        missing_vars+=("GOOGLE_CLIENT_SECRET")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_status "Please set these variables in your .env.local file or environment"
        echo "Example .env.local:"
        echo "DATABASE_URL=postgresql://username:password@localhost:5432/projecthub"
        echo "AUTO_REGISTER_DOMAIN=practera.com"
        echo "ADMIN_USERS=admin@practera.com,manager@practera.com"
        echo "OPENAI_API_KEY=your_openai_key"
        echo "GOOGLE_CLIENT_ID=your_google_client_id"
        echo "GOOGLE_CLIENT_SECRET=your_google_client_secret"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Function to test database connection
test_database() {
    print_status "Testing database connection..."
    
    # Extract database components for testing
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        print_status "Database details:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  Database: $DB_NAME"
        echo "  User: $DB_USER"
    else
        print_error "Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database"
        exit 1
    fi
    
    # Test connection using psql if available
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_error "Failed to connect to database"
            print_status "Make sure your PostgreSQL server is running and accessible"
            if [[ "$DB_HOST" == "localhost" ]]; then
                print_status "For local Docker PostgreSQL, you can start it with:"
                echo "  docker run --name postgres -e POSTGRES_PASSWORD=$DB_PASS -e POSTGRES_USER=$DB_USER -e POSTGRES_DB=$DB_NAME -p $DB_PORT:5432 -d postgres"
            fi
            exit 1
        fi
    else
        print_warning "psql not found, skipping database connection test"
        print_status "The scripts will test the connection during execution"
    fi
}

# Function to check if we're in the correct directory
check_directory() {
    print_status "Checking current directory..."
    
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Please run this script from the project root directory"
        exit 1
    fi
    
    if [[ ! -d "scripts" ]]; then
        print_error "scripts directory not found. Please run this script from the src directory"
        exit 1
    fi
    
    print_success "Directory structure looks good"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing/updating dependencies..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if npm run db:push; then
        print_success "Database schema updated successfully"
    else
        print_error "Failed to update database schema"
        exit 1
    fi
}

# Function to bootstrap the system
bootstrap_system() {
    print_status "Bootstrapping system with core roles and admin users..."
    
    if npx tsx scripts/install.ts; then
        print_success "System bootstrap completed"
    else
        print_error "Failed to bootstrap system"
        exit 1
    fi
}

# Function to seed sample data
seed_data() {
    print_status "Do you want to seed the database with sample data? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Seeding database with sample data..."
        
        if npx tsx scripts/seed.ts; then
            print_success "Sample data seeded successfully"
        else
            print_error "Failed to seed sample data"
            print_warning "You can run 'npm run seed' manually later"
        fi
    else
        print_status "Skipping sample data seeding"
    fi
}

# Function to import projects
import_projects() {
    print_status "Do you want to import project briefs? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Checking for project briefs file..."
        
        # Check for default file location
        if [[ -f "../project-brief-generator/enhanced_project_briefs_v2.json" ]]; then
            print_status "Found project briefs file, importing..."
            
            if npx tsx scripts/import-projects.ts; then
                print_success "Projects imported successfully"
            else
                print_error "Failed to import projects"
                print_warning "You can run 'npm run import:projects' manually later"
            fi
        else
            print_status "No default project briefs file found"
            print_status "You can import projects later with: npm run import:projects -- --file /path/to/your/file.json"
        fi
    else
        print_status "Skipping project import"
    fi
}

# Function to display final status
show_completion() {
    echo ""
    print_success "🎉 ProjectHub initialization completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Start the development server: npm run dev"
    echo "  2. Visit http://localhost:3000 to access ProjectHub"
    echo "  3. Login with one of your admin users: $ADMIN_USERS"
    echo "  4. Visit http://localhost:3000/manager to manage projects and campaigns"
    echo ""
    print_status "Available commands:"
    echo "  - npm run seed                    # Add more sample data"
    echo "  - npm run import:projects         # Import project briefs"
    echo "  - npm run extract:batch <dir>     # Extract projects from documents"
    echo ""
    print_status "For more information, see: src/scripts/README.md"
}

# Main execution flow
main() {
    echo "╔════════════════════════════════════════╗"
    echo "║           ProjectHub Setup             ║"
    echo "║        Initialization Script           ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    # Step 1: Check environment
    check_env_vars
    check_directory
    
    # Step 2: Test database connection
    test_database
    
    # Step 3: Install dependencies and run migrations
    install_dependencies
    run_migrations
    
    # Step 4: Bootstrap system
    bootstrap_system
    
    # Step 5: Optional data seeding
    seed_data
    
    # Step 6: Optional project import
    import_projects
    
    # Step 7: Show completion message
    show_completion
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"