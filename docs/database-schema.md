# ProjectHub Database Schema Documentation

## Overview

ProjectHub uses PostgreSQL with Prisma ORM. The database is organized around the **Concept Design** pattern, where each concept maintains its own state independently, and relationships are managed through generic Membership and Relationship tables.

## Database Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION & USERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │    User      │────────>│   Session    │         │ Verification │        │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤        │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │        │
│  │ name         │         │ expiresAt    │         │ identifier   │        │
│  │ email        │         │ token        │         │ value        │        │
│  │ emailVerified│         │ ipAddress    │         │ expiresAt    │        │
│  │ image        │         │ userAgent    │         │ createdAt    │        │
│  │ createdAt    │         │ userId (FK)  │         └──────────────┘        │
│  │ updatedAt    │         │ createdAt    │                                  │
│  └──────────────┘         │ updatedAt    │                                  │
│         │                 └──────────────┘                                  │
│         │                                                                    │
│         └─────────────┐                                                      │
│                       │                                                      │
│  ┌────────────────────▼────────────────────────────────────────────┐       │
│  │                      Account (OAuth)                              │       │
│  ├───────────────────────────────────────────────────────────────────┤      │
│  │ id (PK) │ accountId │ providerId │ userId (FK) │ accessToken      │      │
│  │ refreshToken │ idToken │ expiresAt │ password │ createdAt          │      │
│  └───────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    CORE ORGANIZATIONAL STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐                                                        │
│  │  Organization    │                                                        │
│  ├──────────────────┤                                                        │
│  │ id (PK)          │                                                        │
│  │ name             │                                                        │
│  │ description      │                                                        │
│  │ domain (unique)  │                                                        │
│  │ organizationType │                                                        │
│  │ contactEmail     │                                                        │
│  │ website          │                                                        │
│  │ parentOrg        │  (Self-referential for hierarchy)                     │
│  │ isActive         │                                                        │
│  │ settings (JSON)  │                                                        │
│  │ createdAt        │                                                        │
│  │ updatedAt        │                                                        │
│  └──────────────────┘                                                        │
│           │                                                                   │
│           │ (linked via Membership)                                          │
│           ▼                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │     Team         │         │    Campaign      │                          │
│  ├──────────────────┤         ├──────────────────┤                          │
│  │ id (PK)          │         │ id (PK)          │                          │
│  │ name             │         │ name             │                          │
│  │ description      │         │ description      │                          │
│  │ teamType         │         │ learningObj[]    │                          │
│  │ maxMembers       │         │ startDate        │                          │
│  │ status           │         │ endDate          │                          │
│  │ createdAt        │         │ maxParticipants  │                          │
│  │ updatedAt        │         │ participantIds[] │                          │
│  └──────────────────┘         │ industryConstr   │                          │
│                                │ projectConstr    │                          │
│                                │ landingPageCfg   │                          │
│                                │ status           │                          │
│                                │ contactEmail     │                          │
│                                │ createdAt        │                          │
│                                │ updatedAt        │                          │
│                                └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT MANAGEMENT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │                        Project                              │             │
│  ├────────────────────────────────────────────────────────────┤             │
│  │ id (PK)                                                     │             │
│  │ title                                                       │             │
│  │ description                                                 │             │
│  │ image                                                       │             │
│  │ scope                                                       │             │
│  │ industry                                                    │             │
│  │ domain                                                      │             │
│  │ difficulty         (beginner/intermediate/advanced)         │             │
│  │ estimatedHours                                              │             │
│  │ deliverables[]                                              │             │
│  │ status            (draft/active/archived)                   │             │
│  │ templateType                                                │             │
│  │ aiGenerated       (boolean)                                │             │
│  │ sourceData (JSON)  (AI extraction metadata)                │             │
│  │ fileHash          (unique, for deduplication)              │             │
│  │ createdAt                                                   │             │
│  │ updatedAt                                                   │             │
│  └────────────────────────────────────────────────────────────┘             │
│           │                                                                   │
│           │ 1:N                                                               │
│           ▼                                                                   │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │              ProjectApplication                             │             │
│  ├────────────────────────────────────────────────────────────┤             │
│  │ id (PK)                                                     │             │
│  │ projectId (FK) ──────> Project                             │             │
│  │ applicantName                                               │             │
│  │ applicantEmail                                              │             │
│  │ applicantImage                                              │             │
│  │ linkedinUrl                                                 │             │
│  │ message                                                     │             │
│  │ videoUrl                                                    │             │
│  │ status            (pending/approved/rejected)               │             │
│  │ appliedAt                                                   │             │
│  │ reviewedAt        (timestamp when approved/rejected)        │             │
│  │ reviewedBy        (email of expert/admin who reviewed)      │             │
│  │ createdAt                                                   │             │
│  │ updatedAt                                                   │             │
│  │                                                             │             │
│  │ UNIQUE(projectId, applicantEmail)                          │             │
│  │                                                             │             │
│  │ Approval Workflow:                                          │             │
│  │ 1. Learner applies → status: 'pending'                     │             │
│  │ 2. Expert/Educator/Manager/Admin reviews                   │             │
│  │ 3. Approved → status: 'approved', reviewedAt, reviewedBy   │             │
│  │    Rejected → status: 'rejected', reviewedAt, reviewedBy   │             │
│  └────────────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL (RBAC)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                         Role                              │               │
│  ├──────────────────────────────────────────────────────────┤               │
│  │ id (PK)                                                   │               │
│  │ displayName                                               │               │
│  │ description                                               │               │
│  │ scope          (platform/organization/campaign/          │               │
│  │                 project/team/user)                       │               │
│  │ permissions (JSON)                                        │               │
│  │   {                                                       │               │
│  │     users: { create, read, update, delete }              │               │
│  │     projects: { create, read, update, delete }           │               │
│  │     teams: { create, read, update, delete }              │               │
│  │     ...                                                   │               │
│  │   }                                                       │               │
│  │ isActive                                                  │               │
│  │ isBuiltIn      (system roles cannot be deleted)          │               │
│  │ createdAt                                                 │               │
│  │ updatedAt                                                 │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  Standard Roles (Built-in):                                                  │
│  • platform_admin    - Full platform access                                  │
│  • org_admin         - Organization management                               │
│  • educator          - Educational content management                        │
│  • expert            - Project guidance and feedback                         │
│  • industry_partner  - Industry collaboration                                │
│  • team_leader       - Team leadership                                       │
│  • learner           - Learning participation                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    GENERIC RELATIONSHIP SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                    Membership                             │               │
│  │  (Links entities with roles in contexts)                 │               │
│  ├──────────────────────────────────────────────────────────┤               │
│  │ id (PK)                                                   │               │
│  │ memberEntityType    (user/project/team/etc)              │               │
│  │ memberEntityId                                            │               │
│  │ targetEntityType    (organization/campaign/team/etc)     │               │
│  │ targetEntityId                                            │               │
│  │ roleEntityId (FK) ──────> Role                           │               │
│  │ status             (active/pending/inactive)             │               │
│  │ isActive                                                  │               │
│  │ joinedAt                                                  │               │
│  │ createdAt                                                 │               │
│  │ updatedAt                                                 │               │
│  │                                                           │               │
│  │ Examples:                                                 │               │
│  │ • User → Organization (with org_admin role)              │               │
│  │ • User → Team (with learner role)                        │               │
│  │ • Project → Organization (with project_member role)      │               │
│  │ • User → Campaign (with educator role)                   │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                   Relationship                            │               │
│  │  (Arbitrary metadata connections between entities)       │               │
│  ├──────────────────────────────────────────────────────────┤               │
│  │ id (PK)                                                   │               │
│  │ fromEntityType     (project/user/organization/etc)       │               │
│  │ fromEntityId                                              │               │
│  │ toEntityType       (organization/campaign/team/etc)      │               │
│  │ toEntityId                                                │               │
│  │ relationType       (child/parent/belongs_to/etc)         │               │
│  │ metadata (JSON)    (arbitrary relationship data)         │               │
│  │ createdAt                                                 │               │
│  │ updatedAt                                                 │               │
│  │                                                           │               │
│  │ Examples:                                                 │               │
│  │ • Project → Organization (belongs_to)                    │               │
│  │ • Team → Project (assigned_to)                           │               │
│  │ • User → User (mentors/follows)                          │               │
│  └──────────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROFILE SYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                       Profile                             │               │
│  │  (Extended info for expert/industry_partner roles)       │               │
│  ├──────────────────────────────────────────────────────────┤               │
│  │ id (PK)                                                   │               │
│  │ userId (FK) ──────> User                                 │               │
│  │ profileType        (expert/industry_partner)             │               │
│  │ bio                                                       │               │
│  │ expertise[]                                               │               │
│  │ industries[]                                              │               │
│  │ yearsExperience                                           │               │
│  │ company                                                   │               │
│  │ position                                                  │               │
│  │ linkedIn                                                  │               │
│  │ website                                                   │               │
│  │ availability                                              │               │
│  │ hourlyRate                                                │               │
│  │ preferredProjectTypes[]                                   │               │
│  │ maxProjects                                               │               │
│  │ rating                                                    │               │
│  │ isActive                                                  │               │
│  │ isVerified                                                │               │
│  │ createdAt                                                 │               │
│  │ updatedAt                                                 │               │
│  └──────────────────────────────────────────────────────────┘               │
│           │                                                                   │
│           │ 1:N                                                               │
│           ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                       Skill                               │               │
│  ├──────────────────────────────────────────────────────────┤               │
│  │ id (PK)                                                   │               │
│  │ name                                                      │               │
│  │ kind                                                      │               │
│  │ level                                                     │               │
│  │ isExpertise                                               │               │
│  │ yearsExperience                                           │               │
│  │ proficiency                                               │               │
│  │ createdAt                                                 │               │
│  │ updatedAt                                                 │               │
│  │                                                           │               │
│  │ UNIQUE(name, kind)                                        │               │
│  └──────────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADDITIONAL UTILITY TABLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Note: The following concepts are defined in specs but not yet fully         │
│  implemented in the database schema:                                         │
│                                                                               │
│  • Assignment    - Task/project assignments with progress tracking           │
│  • File          - Document attachments and file management                  │
│  • Comment       - Discussion threads on projects/assignments                │
│  • Notification  - User notifications for events                             │
│  • Tag           - Categorization and labeling system                        │
│  • Note          - User notes and annotations                                │
│  • Setting       - System and user preferences                               │
│  • Feedback      - Project feedback from experts                             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. **Concept Independence**
Each table represents an independent concept with minimal direct foreign key relationships. Connections are managed through:
- **Membership**: Role-based entity associations
- **Relationship**: Arbitrary metadata connections

### 2. **Hierarchical RBAC**
```
Platform Scope (Broadest)
    ↓
Organization Scope
    ↓
Campaign Scope
    ↓
Project Scope
    ↓
Team Scope
    ↓
User Scope (Narrowest)
```

Permission resolution uses the narrowest applicable role for a resource.

### 3. **Generic Membership Pattern**
```
User ──[Membership with Role]──> Organization
User ──[Membership with Role]──> Campaign  
User ──[Membership with Role]──> Team
Project ──[Membership with Role]──> Organization
Campaign ──[Membership with Role]──> Organization
```

### 4. **AI Integration Fields**
Projects include AI-specific fields:
- `aiGenerated` - Boolean flag for AI-created projects
- `sourceData` - JSON metadata from extraction
- `fileHash` - Unique hash for document deduplication
- `templateType` - Project template categorization

## Relationship Examples

### User Access Control
```
1. User creates account → User table
2. User joins organization → Membership (User → Org + Role)
3. User gets educator role in campaign → Membership (User → Campaign + educator role)
4. User joins team as learner → Membership (User → Team + learner role)
```

### Project Lifecycle
```
1. Project created → Project table
2. Project linked to org → Membership (Project → Org + project_member role)
                        → Relationship (Project → Org, belongs_to)
3. Students apply → ProjectApplication table
4. Project assigned to team → Relationship (Team → Project, assigned_to)
```

### Campaign Management
```
1. Campaign created → Campaign table
2. Campaign belongs to org → Membership (Campaign → Org + campaign_member role)
3. Users join campaign → Membership (User → Campaign + participant role)
4. Projects linked to campaign → Relationship (Project → Campaign, associated_with)
```

## Critical Indexes

```sql
-- User authentication
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_session_token ON "session"(token);

-- RBAC lookups
CREATE INDEX idx_membership_member ON "membership"(memberEntityType, memberEntityId);
CREATE INDEX idx_membership_target ON "membership"(targetEntityType, targetEntityId);
CREATE INDEX idx_relationship_from ON "relationship"(fromEntityType, fromEntityId);
CREATE INDEX idx_relationship_to ON "relationship"(toEntityType, toEntityId);

-- Project queries
CREATE INDEX idx_project_industry ON "project"(industry);
CREATE INDEX idx_project_status ON "project"(status);
CREATE INDEX idx_project_filehash ON "project"(fileHash);

-- Profile lookups
CREATE INDEX idx_profile_type ON "profile"(profileType);
CREATE INDEX idx_profile_active ON "profile"(isActive);
CREATE INDEX idx_profile_verified ON "profile"(isVerified);
```

## Data Flow Patterns

### 1. **Project Document Extraction**
```
Document Upload
    ↓
AI Extraction Service (extractFromDocument)
    ↓
Check fileHash for duplicates
    ↓
Create Project record
    ↓
Generate AI image
    ↓
Create Membership (Project → Organization)
    ↓
Create Relationship (Project → Organization, belongs_to)
```

### 2. **User Registration & Role Assignment**
```
User registers
    ↓
Create User record
    ↓
Verify email
    ↓
Auto-assign to default organization (via AUTO_REGISTER_DOMAIN)
    ↓
Create Membership (User → Organization + default role)
    ↓
Create Profile (if expert/industry_partner role)
```

### 3. **Permission Check Flow**
```
User action request
    ↓
Get user's memberships for target entity
    ↓
Find narrowest scope role applicable
    ↓
Check role permissions for requested action
    ↓
Allow/Deny
```

### 4. **Project Application & Approval Workflow**
```
Learner browses projects
    ↓
Learner clicks "Apply Now"
    ↓
Submit application with LinkedIn, message, optional video
    ↓
Create ProjectApplication record (status: 'pending')
    ↓
Learner sees "APPLIED" badge (pending status)
    ↓
Expert/Educator/Manager/Admin reviews application
    ↓
Approve/Reject via POST /api/applications/[id]/approve
    ↓
Update status to 'approved' or 'rejected'
    ↓
Set reviewedAt timestamp and reviewedBy email
    ↓
Learner sees "ACCEPTED" or "REJECTED" badge
    ↓
(Future) Send notification to learner
```

## Schema Evolution Notes

### Current State
- ✅ Core authentication (User, Session, Account)
- ✅ Organization hierarchy
- ✅ Project management with AI extraction
- ✅ Role-based access control
- ✅ Generic Membership/Relationship system
- ✅ Profile system for experts/partners
- ✅ Campaign management
- ✅ Team structure
- ✅ Project applications with approval workflow

### Pending Implementation
- ⏳ Assignment tracking
- ⏳ File attachments
- ⏳ Comment threads
- ⏳ Notification system
- ⏳ Tag/categorization
- ⏳ Feedback system

### Future Enhancements
- 📋 Analytics aggregation tables
- 📋 Full-text search indexes
- 📋 Audit log tables
- 📋 Workflow state machines

## Database Constraints

### Unique Constraints
```
user.email                          - One email per user
organization.domain                 - Unique domain per org
project.fileHash                    - Prevent duplicate document imports
projectApplication.(projectId, applicantEmail) - One application per user per project
skill.(name, kind)                  - Unique skill definitions
```

### Cascading Deletes
```
User deletion → Cascade to: Session, Account, Profile
Project deletion → Cascade to: ProjectApplication
Organization deletion → No cascade (prevent data loss)
```

### Default Values
```
Role.isActive = true
Profile.isActive = true
Profile.isVerified = false
Project.status = 'draft'
ProjectApplication.status = 'pending'
Membership.isActive = true
```

## Performance Considerations

### Query Optimization
1. **Membership lookups** are critical path - heavily indexed
2. **Project filtering** by industry/status - composite indexes
3. **Profile searches** by type/expertise - JSON indexing
4. **Relationship traversal** - bidirectional indexes

### Scaling Strategies
1. **Partitioning**: Projects by creation date
2. **Archival**: Completed campaigns to separate storage
3. **Caching**: Role permissions in Redis
4. **Read Replicas**: For analytics queries

---

**Last Updated**: 2024-01-10  
**Schema Version**: 1.0  
**Prisma Version**: Latest