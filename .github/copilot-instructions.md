# GitHub Copilot Instructions for ProjectHub

## Project Overview

ProjectHub is a platform for sourcing and managing industry projects and partner companies, built using a **Concept Design** architecture. The system emphasizes independent, composable concepts that coordinate through synchronizations rather than direct dependencies.

## Core Architecture Principles

### 1. Concept Design Framework

**Concepts are INDEPENDENT modules** with strict isolation rules:

- ✅ Each concept has a single, clear purpose
- ✅ Concepts are implemented as TypeScript classes in `src/lib/concepts/`
- ✅ Specifications live in `specs/concepts/` using Simple State Form (SSF) syntax
- ❌ **NO cross-concept imports** - concepts cannot reference each other
- ❌ **NO shared types between concepts** - each is self-contained
- ❌ **NO direct method calls** between concepts

**Action/Query Patterns:**

```typescript
// Actions: Modify state, single input/output object
async create(input: { field: string }): Promise<{ entity: Entity } | { error: string }> {
  // Implementation
}

// Queries: Read-only, return arrays, prefixed with underscore
async _getAll(input: {}): Promise<Entity[]> {
  return await prisma.entity.findMany();
}
```

**Error Handling:**
- Errors are return values, not exceptions: `{ error: string }`
- Never throw errors from concept actions
- Use discriminated unions for success/error cases

### 2. Synchronizations (Syncs)

**Syncs coordinate concepts** without coupling them:

```typescript
// Pattern for all syncs
const SyncName = ({ request, userId, data }: Vars) => ({
  when: actions([
    ConceptA.action, 
    { input: 'params' }, 
    { output: 'binding' }
  ]),
  where: (frames: Frames) => {
    // Optional filtering logic
  },
  then: actions([
    ConceptB.action,
    { input: 'params' }
  ]),
});
```

- Syncs live in `src/lib/syncs/` and specifications in `specs/syncs/`
- Register all syncs in `src/lib/server.ts`
- Use `actions()` helper for declarative coordination
- Leverage `Vars` for frame-based data binding

### 3. Tech Stack

**Frontend:**
- Next.js 15+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS for styling
- React Server Components where possible

**Backend:**
- PostgreSQL database
- Prisma ORM (schema in `src/prisma/schema.prisma`)
- Better Auth for authentication
- OpenAI API for AI features

**Key Dependencies:**
- `@prisma/client` - Database access
- `better-auth` - Authentication
- `openai` - AI integration
- `llamaindex` - RAG and embeddings
- `mammoth` - Document processing

## Project Structure

```
src/
├── lib/
│   ├── concepts/          # Independent concept implementations
│   │   ├── common/        # Generic concepts (User, Role, Organization)
│   │   └── project/       # Domain concepts (Project, Campaign)
│   ├── syncs/             # Synchronization implementations
│   ├── engine/            # Core concept design engine
│   └── ai/                # AI services (extraction, embeddings)
├── app/                   # Next.js pages and API routes
├── components/            # Reusable React components
├── prisma/                # Database schema and migrations
└── scripts/               # Utility scripts

specs/
├── concepts/              # Concept specifications (.concept files)
└── syncs/                 # Synchronization specifications (.sync files)

docs/
├── concept-design.md      # Core architecture guide
├── concept-implementation.md  # Implementation patterns
└── auth-usage.md          # RBAC usage guide
```

## Development Guidelines

### When Creating/Modifying Concepts

1. **Start with the specification** in `specs/concepts/`
2. **Implement in TypeScript** following exact spec structure
3. **Use Prisma for persistence** - all state goes to database
4. **Single input/output objects** for all actions
5. **Queries must return arrays** and be prefixed with `_`
6. **No dependencies** on other concepts

Example:
```typescript
export class ProjectConcept {
  async create(input: {
    title: string;
    description: string;
    industry: string;
    difficulty: string;
  }): Promise<{ project: Project } | { error: string }> {
    // Validate inputs
    // Create in database
    // Return success or error
  }

  async _getByIndustry(input: { industry: string }): Promise<Project[]> {
    return await prisma.project.findMany({
      where: { industry: input.industry }
    });
  }
}
```

### When Creating/Modifying Syncs

1. **Define clear trigger conditions** in `when`
2. **Use `Vars` for data binding** between frames
3. **Keep sync logic simple** - no complex business logic
4. **Register in `src/lib/server.ts`**

Example:
```typescript
export function makeProjectSyncs(API: APIConcept, Project: ProjectConcept) {
  const CreateProject = ({ request, title, description }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "POST", path: "/api/projects" },
      { request }
    ]),
    then: actions([
      Project.create,
      { title, description }
    ]),
  });

  return { CreateProject };
}
```

### API Routes Pattern

All API routes proxy through the `API` concept:

```typescript
// app/api/projects/route.ts
import { Sync } from "@/lib/server";

export async function POST(request: Request) {
  const body = await request.json();
  
  const result = await Sync.API.request({
    method: "POST",
    path: "/api/projects",
    body,
    headers: {
      'x-user-id': user.id,
      'x-user-email': user.email
    }
  });

  return Response.json(result.response?.body);
}
```

### RBAC (Role-Based Access Control)

**Standard Roles:**
- `platform_admin` - Full platform access
- `manager` - Organization management
- `educator` - Campaign and project management
- `expert` - Project guidance
- `learner` - Project participation

**Permission Checking:**

```typescript
import { useAuth } from '@/lib/auth-context';

function Component() {
  const { hasPermission, hasRole } = useAuth();

  if (!hasPermission('projects', 'create')) {
    return <div>Access denied</div>;
  }

  if (hasRole(ROLES.MANAGER)) {
    // Show manager UI
  }
}
```

See [`docs/auth-usage.md`](docs/auth-usage.md) for complete patterns.

### AI Features

**Project Extraction:**

```typescript
import { ProjectConcept } from '@/lib/concepts/project/project';

const result = await projectConcept.extractFromDocument({
  fileBuffer: buffer,
  originalFilename: 'project.docx',
  organizationId: 'org-123',
  quality: 'medium', // 'low' | 'medium' | 'high'
  onProgress: (stage, progress) => {
    console.log(`${stage}: ${progress}%`);
  }
});
```

**Service Classes:**
- [`ProjectExtractionService`](src/lib/ai/projectExtractionService.ts) - Extract projects from documents
- [`AIService`](src/lib/ai/aiService.ts) - Base class for AI operations
- [`openaiFileService`](src/lib/ai/openaiFileService.ts) - File upload and management

## Important Files to Reference

### Core Architecture
- [`docs/concept-design.md`](docs/concept-design.md) - Concept framework philosophy
- [`docs/concept-implementation.md`](docs/concept-implementation.md) - Implementation guide
- [`docs/synchronization-implementation.md`](docs/synchronization-implementation.md) - Sync patterns
- [`docs/concept-state-specification.md`](docs/concept-state-specification.md) - SSF syntax

### Implementation Examples
- [`src/lib/concepts/project/project.ts`](src/lib/concepts/project/project.ts) - Project concept
- [`src/lib/concepts/common/user.ts`](src/lib/concepts/common/user.ts) - User concept
- [`src/lib/syncs/project/project.sync.ts`](src/lib/syncs/project/project.sync.ts) - Project syncs
- [`src/lib/syncs/common/auth.ts`](src/lib/syncs/common/auth.ts) - Auth syncs

### Database & Scripts
- [`src/prisma/schema.prisma`](src/prisma/schema.prisma) - Database schema
- [`src/scripts/README.md`](src/scripts/README.md) - Available scripts
- [`src/scripts/batch-extract-documents.ts`](src/scripts/batch-extract-documents.ts) - Batch processing

## Common Tasks

### Add a New Concept

1. Create specification in `specs/concepts/YourConcept.concept`
2. Implement class in `src/lib/concepts/your-concept.ts`
3. Add Prisma model in `src/prisma/schema.prisma`
4. Run `npm run db:push` to update database
5. Register in `src/lib/server.ts`
6. Create syncs for coordination in `src/lib/syncs/`

### Add a New API Endpoint

1. Create sync function in `src/lib/syncs/`
2. Register sync in `src/lib/server.ts`
3. Create route in `src/app/api/your-endpoint/route.ts`
4. Use `Sync.API.request()` to trigger sync
5. Add permission checks using `hasPermission()`

### Add a New Page

1. Create page in `src/app/your-page/page.tsx`
2. Use `'use client'` for interactive components
3. Import `useAuth()` for authentication
4. Fetch data via API routes (not direct concept calls)
5. Use Tailwind CSS for styling

## Testing

```bash
# Run all tests
npm test

# Test specific concept
npm run test:concepts

# Test syncs
npm run test:syncs

# Integration tests
npm run test:integration
```

## Common Pitfalls to Avoid

❌ **DON'T:**
- Import concepts from other concepts
- Throw errors from concept actions
- Access database directly from pages/components
- Use server-side concepts in client components
- Create circular dependencies between syncs

✅ **DO:**
- Return error objects: `{ error: string }`
- Use API routes for all data access
- Keep concepts independent
- Follow single input/output pattern
- Use Prisma for all database operations
- Register all syncs in `src/lib/server.ts`

## Environment Variables

Required in `.env.local`:

```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
BETTER_AUTH_SECRET=...
ADMIN_USERS=admin@example.com
AUTO_REGISTER_DOMAIN=example.com
```

## Key Concepts Reference

### Core Concepts
- [`User`](src/lib/concepts/common/user.ts) - User identity and registration
- [`Role`](src/lib/concepts/common/role.ts) - Roles and permissions
- [`Organization`](src/lib/concepts/common/organization.ts) - Organizational entities
- [`Membership`](src/lib/concepts/common/membership.ts) - Membership relationships
- [`Project`](src/lib/concepts/project/project.ts) - Project specifications
- [`Campaign`](src/lib/concepts/project/campaign.ts) - Campaign management
- [`Team`](src/lib/concepts/common/team.ts) - Team formation

### Utility Concepts
- [`API`](src/lib/concepts/common/api.ts) - HTTP request/response handling
- [`Session`](src/lib/concepts/common/session.ts) - Session management
- [`Auth`](src/lib/concepts/common/auth.ts) - Authentication workflows
- [`Profile`](src/lib/concepts/common/profile.ts) - User profiles

## Additional Resources

- [Setup Guide](SETUP_GUIDE.md) - Initial setup instructions
- [Architecture Overview](docs/architecture.md) - System architecture
- [RBAC Examples](docs/RBAC-EXAMPLE.md) - Permission patterns
- [Database Schema](docs/database-schema.md) - Schema documentation

## Notes for AI Assistants

When generating code for this project:

1. **Always check concept independence** - verify no cross-imports
2. **Follow action/query naming** - actions modify, queries read (prefixed `_`)
3. **Use Prisma for persistence** - never in-memory state
4. **Return error objects** - never throw exceptions
5. **Register all syncs** - add to `src/lib/server.ts`
6. **Reference existing patterns** - look at similar concepts/syncs
7. **Maintain TypeScript strictness** - full type annotations
8. **Consider RBAC** - check permissions for protected operations
9. **Use Next.js App Router** - Server Components by default
10. **Document complex logic** - add comments explaining "why"

When suggesting changes, always reference the relevant specification file and ensure the implementation matches it exactly.