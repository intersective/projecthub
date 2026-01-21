-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "type" TEXT DEFAULT 'oauth',
    "userId" TEXT NOT NULL,
    "provider" TEXT,
    "providerId" TEXT,
    "accountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "idToken" TEXT,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_session" (
    "auth_session_pkey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auth_session_token_key" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("auth_session_pkey")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "preferences" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT,
    "token" TEXT,
    "userId" TEXT,
    "currentContext" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "loginMethod" TEXT DEFAULT 'email',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "memberEntityType" TEXT NOT NULL,
    "memberEntityId" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "roleEntityId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitationMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "organizationType" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "website" TEXT,
    "parentOrganization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "scope" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "deliverables" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "templateType" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sourceData" JSONB,
    "fileHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_application" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantImage" TEXT,
    "linkedinUrl" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "videoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learningObjectives" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industryConstraints" JSONB NOT NULL DEFAULT '{}',
    "projectConstraints" JSONB NOT NULL DEFAULT '{}',
    "landingPageConfig" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'forming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "assigneeEntityType" TEXT NOT NULL,
    "assigneeEntityId" TEXT NOT NULL,
    "assignerEntityType" TEXT NOT NULL,
    "assignerEntityId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "priority" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "noteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_request" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "body" JSONB,
    "params" JSONB,
    "query" JSONB,
    "headers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_response" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "body" JSONB,
    "headers" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "linkedinUrl" TEXT,
    "website" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "hourlyRate" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT,
    "level" TEXT,
    "isExpertise" BOOLEAN NOT NULL DEFAULT false,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "proficiency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship" (
    "id" TEXT NOT NULL,
    "fromEntityType" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityType" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "reactions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_link" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_auth_session_token_key_key" ON "auth_session"("auth_session_token_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionKey_key" ON "session"("sessionKey");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "role_displayName_scope_key" ON "role"("displayName", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "membership_memberEntityType_memberEntityId_targetEntityType_key" ON "membership"("memberEntityType", "memberEntityId", "targetEntityType", "targetEntityId", "roleEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_domain_key" ON "organization"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "project_fileHash_key" ON "project"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "project_application_projectId_applicantEmail_key" ON "project_application"("projectId", "applicantEmail");

-- CreateIndex
CREATE INDEX "profile_profileType_idx" ON "profile"("profileType");

-- CreateIndex
CREATE INDEX "profile_isActive_idx" ON "profile"("isActive");

-- CreateIndex
CREATE INDEX "profile_isVerified_idx" ON "profile"("isVerified");

-- CreateIndex
CREATE INDEX "skill_name_idx" ON "skill"("name");

-- CreateIndex
CREATE INDEX "skill_isExpertise_idx" ON "skill"("isExpertise");

-- CreateIndex
CREATE UNIQUE INDEX "skill_name_kind_key" ON "skill"("name", "kind");

-- CreateIndex
CREATE INDEX "relationship_fromEntityType_fromEntityId_relationType_idx" ON "relationship"("fromEntityType", "fromEntityId", "relationType");

-- CreateIndex
CREATE INDEX "relationship_toEntityType_toEntityId_relationType_idx" ON "relationship"("toEntityType", "toEntityId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_fromEntityType_fromEntityId_toEntityType_toEnt_key" ON "relationship"("fromEntityType", "fromEntityId", "toEntityType", "toEntityId", "relationType");

-- CreateIndex
CREATE INDEX "notification_isRead_idx" ON "notification"("isRead");

-- CreateIndex
CREATE INDEX "notification_notificationType_idx" ON "notification"("notificationType");

-- CreateIndex
CREATE INDEX "file_isPublic_idx" ON "file"("isPublic");

-- CreateIndex
CREATE INDEX "setting_category_idx" ON "setting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "setting_category_key_key" ON "setting"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "tag_category_idx" ON "tag"("category");

-- CreateIndex
CREATE INDEX "tag_isActive_idx" ON "tag"("isActive");

-- CreateIndex
CREATE INDEX "tag_name_idx" ON "tag"("name");

-- CreateIndex
CREATE INDEX "project_preference_userId_idx" ON "project_preference"("userId");

-- CreateIndex
CREATE INDEX "project_preference_projectId_idx" ON "project_preference"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_preference_userId_projectId_key" ON "project_preference"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_preference_userId_rank_key" ON "project_preference"("userId", "rank");

-- CreateIndex
CREATE INDEX "industry_preferences_userId_idx" ON "industry_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "industry_preferences_userId_industry_key" ON "industry_preferences"("userId", "industry");

-- CreateIndex
CREATE INDEX "saved_project_userId_idx" ON "saved_project"("userId");

-- CreateIndex
CREATE INDEX "saved_project_projectId_idx" ON "saved_project"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_project_userId_projectId_key" ON "saved_project"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "share_link_code_key" ON "share_link"("code");

-- CreateIndex
CREATE INDEX "share_link_code_idx" ON "share_link"("code");

-- CreateIndex
CREATE INDEX "share_link_userId_idx" ON "share_link"("userId");

-- CreateIndex
CREATE INDEX "share_link_projectId_idx" ON "share_link"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "share_link_userId_projectId_key" ON "share_link"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_application" ADD CONSTRAINT "project_application_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_preferences" ADD CONSTRAINT "industry_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
