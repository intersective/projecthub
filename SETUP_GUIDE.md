# ProjectHub Setup Guide

## Quick Start Checklist

### 1. ✅ Environment Variables (DONE)
The `.env.local` file has been created with default values.

**ACTION REQUIRED:** Edit `.env.local` and update:
- `DATABASE_URL` - Your PostgreSQL connection string
- `ADMIN_USERS` - Comma-separated list of admin emails
- `AUTO_REGISTER_DOMAIN` - Your organization's domain
- `OPENAI_API_KEY` - Your OpenAI API key (for AI features)
- `BETTER_AUTH_SECRET` - Generate a random secret key

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install src dependencies
cd src
npm install
cd ..
```

### 3. Database Setup

Make sure PostgreSQL is running, then:

```bash
# Push the Prisma schema to your database
npm run db:push

# (Optional) Open Prisma Studio to view your database
npm run db:studio
```

### 4. Bootstrap the System

This creates core roles, default organization, and admin users:

```bash
npm run install:system
```

**What this does:**
- ✅ Creates 5 core roles (platform_admin, manager, educator, provider, learner)
- ✅ Creates default organization using `AUTO_REGISTER_DOMAIN`
- ✅ Creates "Starter Campaign"
- ✅ Registers admin users from `ADMIN_USERS`
- ✅ Assigns platform_admin role to admins
- ✅ Adds admins to organization and campaign

### 5. (Optional) Add Sample Data

```bash
# Add sample campaigns
npm run seed

# Import project briefs from JSON
npm run import:projects
```

### 6. Start the Application

```bash
npm run dev
```

Visit http://localhost:3000 and log in with one of your admin emails.

---

## Detailed Configuration

### Database URL Format

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Examples:**
```bash
# Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/projecthub?schema=public

# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?schema=public

# Railway
DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:7777/railway?schema=public
```

### Generate Random Secret

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Email Configuration

**Development (Console logging):**
```bash
EMAIL_PROVIDER=console
```

**Production (SMTP):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

For Gmail, you'll need to create an [App Password](https://support.google.com/accounts/answer/185833).

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npm run db:studio
```

### Reset Database

```bash
# WARNING: This will delete all data
npm run db:reset
```

### Check System Status

```bash
npm run status
```

---

## Next Steps

1. **Customize Organization Settings**
   - Visit http://localhost:3000/admin/organizations
   - Update organization details, logo, and settings

2. **Create Campaigns**
   - Visit http://localhost:3000/admin/campaigns
   - Set up learning objectives and project constraints

3. **Import Projects**
   - Use the project import script or AI extraction
   - Visit http://localhost:3000/admin/projects

4. **Invite Users**
   - Add educators, experts, and learners
   - Assign roles and permissions

---

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Create migration
npm run db:reset         # Reset database

# System Setup
npm run install:system   # Bootstrap system
npm run seed             # Add sample data
npm run import:projects  # Import projects from JSON

# Testing
npm run test             # Run all tests
npm run test:concepts    # Test concepts
npm run test:syncs       # Test synchronizations
npm run test:integration # Integration tests
```

---

## Architecture Reference

- See `/docs/architecture.md` for system overview
- See `/docs/concept-design.md` for concept framework
- See `/docs/auth-usage.md` for authentication patterns
- See `/docs/RBAC-EXAMPLE.md` for role management

---

## Support

For issues or questions, check:
- Documentation in `/docs`
- Script README in `/src/scripts/README.md`
- Concept specifications in `/specs/concepts`
