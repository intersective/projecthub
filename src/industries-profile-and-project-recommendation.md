# Industry Preferences Feature - Implementation Guide

## Overview
This document provides comprehensive instructions for implementing an industry preferences feature in the learner profile, allowing users to select industries they're interested in, which will be used for project recommendations and UI prioritization.

## Architecture Summary

Following the Concept Design architecture:
- **New Concept**: `IndustryPreference` - Manages user industry preferences
- **Database**: New table `IndustryPreference` to store user-industry relationships
- **Syncs**: Coordinate between Profile, IndustryPreference, and API concepts
- **UI Updates**: Profile page for selection, Projects page for prioritization

## Phase 1: Database Schema

### 1.1 Update Prisma Schema

Add to schema.prisma:

````prisma
// ...existing code...

model IndustryPreference {
  id        String   @id @default(cuid())
  userId    String
  industry  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, industry])
  @@index([userId])
  @@map("industry_preferences")
}

// Add relation to User model
model User {
  // ...existing fields...
  industryPreferences IndustryPreference[]
  // ...existing relations...
}
````

### 1.2 Run Database Migration

```bash
npm run db:push
```

## Phase 2: Concept Specification

### 2.1 Create Concept Specification

Create `specs/concepts/common/IndustryPreference.concept`:

````
concept IndustryPreference {
  state:
    id: String
    userId: String
    industry: String
    createdAt: Date
    updatedAt: Date

  actions:
    // Set user's industry preferences (replaces all existing)
    setPreferences(userId: String, industries: String[]): { preferences: IndustryPreference[] } | { error: String }
    
    // Add a single preference
    addPreference(userId: String, industry: String): { preference: IndustryPreference } | { error: String }
    
    // Remove a single preference
    removePreference(userId: String, industry: String): { success: Boolean } | { error: String }
    
    // Clear all preferences for a user
    clearPreferences(userId: String): { success: Boolean } | { error: String }

  queries:
    // Get preferences for a specific user
    _getByUserId(userId: String): IndustryPreference[]
    
    // Get all users interested in an industry
    _getUsersByIndustry(industry: String): IndustryPreference[]
    
    // Get available industries from projects
    _getAvailableIndustries(): String[]
}
````

## Phase 3: Concept Implementation

### 3.1 Create Concept Class

Create `src/lib/concepts/common/industry-preference.ts`:

````typescript
import { prisma } from "@/lib/prisma";

export interface IndustryPreference {
  id: string;
  userId: string;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
}

export class IndustryPreferenceConcept {
  /**
   * Set user's industry preferences (replaces all existing)
   */
  async setPreferences(input: {
    userId: string;
    industries: string[];
  }): Promise<{ preferences: IndustryPreference[] } | { error: string }> {
    try {
      // Validate input
      if (!input.userId) {
        return { error: "User ID is required" };
      }

      // Remove duplicates and empty strings
      const uniqueIndustries = [...new Set(input.industries.filter(i => i.trim()))];

      // Transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Delete existing preferences
        await tx.industryPreference.deleteMany({
          where: { userId: input.userId }
        });

        // Create new preferences if any
        if (uniqueIndustries.length > 0) {
          await tx.industryPreference.createMany({
            data: uniqueIndustries.map(industry => ({
              userId: input.userId,
              industry: industry.trim()
            }))
          });
        }

        // Fetch and return created preferences
        return await tx.industryPreference.findMany({
          where: { userId: input.userId },
          orderBy: { industry: 'asc' }
        });
      });

      return { preferences: result };
    } catch (error: any) {
      console.error('[IndustryPreference] Failed to set preferences:', error);
      return { error: 'Failed to set industry preferences' };
    }
  }

  /**
   * Add a single preference
   */
  async addPreference(input: {
    userId: string;
    industry: string;
  }): Promise<{ preference: IndustryPreference } | { error: string }> {
    try {
      if (!input.userId || !input.industry?.trim()) {
        return { error: "User ID and industry are required" };
      }

      // Check if preference already exists
      const existing = await prisma.industryPreference.findUnique({
        where: {
          userId_industry: {
            userId: input.userId,
            industry: input.industry.trim()
          }
        }
      });

      if (existing) {
        return { preference: existing };
      }

      // Create new preference
      const preference = await prisma.industryPreference.create({
        data: {
          userId: input.userId,
          industry: input.industry.trim()
        }
      });

      return { preference };
    } catch (error: any) {
      console.error('[IndustryPreference] Failed to add preference:', error);
      return { error: 'Failed to add industry preference' };
    }
  }

  /**
   * Remove a single preference
   */
  async removePreference(input: {
    userId: string;
    industry: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      if (!input.userId || !input.industry?.trim()) {
        return { error: "User ID and industry are required" };
      }

      await prisma.industryPreference.delete({
        where: {
          userId_industry: {
            userId: input.userId,
            industry: input.industry.trim()
          }
        }
      });

      return { success: true };
    } catch (error: any) {
      // Not found is not an error in this case
      if (error.code === 'P2025') {
        return { success: true };
      }
      console.error('[IndustryPreference] Failed to remove preference:', error);
      return { error: 'Failed to remove industry preference' };
    }
  }

  /**
   * Clear all preferences for a user
   */
  async clearPreferences(input: {
    userId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      if (!input.userId) {
        return { error: "User ID is required" };
      }

      await prisma.industryPreference.deleteMany({
        where: { userId: input.userId }
      });

      return { success: true };
    } catch (error: any) {
      console.error('[IndustryPreference] Failed to clear preferences:', error);
      return { error: 'Failed to clear industry preferences' };
    }
  }

  /**
   * Get preferences for a specific user
   */
  async _getByUserId(input: { userId: string }): Promise<IndustryPreference[]> {
    return await prisma.industryPreference.findMany({
      where: { userId: input.userId },
      orderBy: { industry: 'asc' }
    });
  }

  /**
   * Get all users interested in an industry
   */
  async _getUsersByIndustry(input: { industry: string }): Promise<IndustryPreference[]> {
    return await prisma.industryPreference.findMany({
      where: { industry: input.industry },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get available industries from projects
   */
  async _getAvailableIndustries(input: {}): Promise<string[]> {
    const industries = await prisma.project.findMany({
      select: { industry: true },
      distinct: ['industry'],
      where: {
        industry: { not: null },
        status: 'active'
      },
      orderBy: { industry: 'asc' }
    });

    return industries
      .map(p => p.industry)
      .filter((industry): industry is string => Boolean(industry));
  }
}
````

### 3.2 Register Concept in Server

Update server.ts:

````typescript
// ...existing imports...
import { IndustryPreferenceConcept } from "@/lib/concepts/common/industry-preference";

// ...existing code...

// Initialize concepts
const IndustryPreference = new IndustryPreferenceConcept();

// ...existing concepts...

// Export for use in API routes
export const Sync = {
  // ...existing concepts...
  IndustryPreference,
};
````

## Phase 4: Synchronizations

### 4.1 Create Sync Specification

Create `specs/syncs/common/industry-preference.sync`:

````
sync IndustryPreference {
  // Sync industry preferences with profile updates
  UpdateProfileWithPreferences:
    when: API.request(method: "PUT", path: "/api/profile")
    where: request.body.industryPreferences exists
    then: IndustryPreference.setPreferences(
      userId: request.headers['x-user-id'],
      industries: request.body.industryPreferences
    )

  // Get user preferences with profile
  GetProfileWithPreferences:
    when: Profile._getByUserId(userId)
    then: IndustryPreference._getByUserId(userId)
}
````

### 4.2 Create Sync Implementation

Create `src/lib/syncs/common/industry-preference.ts`:

````typescript
import { actions, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { IndustryPreferenceConcept } from "@/lib/concepts/common/industry-preference";
import { ProfileConcept } from "@/lib/concepts/common/profile";

export function makeIndustryPreferenceSyncs(
  API: APIConcept,
  IndustryPreference: IndustryPreferenceConcept,
  Profile: ProfileConcept
) {
  // Update preferences when profile is updated
  const UpdateProfileWithPreferences = ({ request, userId, industries }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "PUT", path: "/api/profile" },
      { request, userId: "request.headers['x-user-id']", industries: "request.body.industryPreferences" }
    ]),
    where: (frames: any) => {
      return frames.some((f: any) => 
        f.request?.body?.industryPreferences !== undefined
      );
    },
    then: actions([
      IndustryPreference.setPreferences,
      { userId, industries }
    ]),
  });

  return {
    UpdateProfileWithPreferences,
  };
}
````

### 4.3 Register Syncs

Update server.ts:

````typescript
// ...existing imports...
import { makeIndustryPreferenceSyncs } from "@/lib/syncs/common/industry-preference";

// ...existing code...

// Register syncs
const industryPreferenceSyncs = makeIndustryPreferenceSyncs(API, IndustryPreference, Profile);
registerSyncs(industryPreferenceSyncs);

// ...existing syncs...
````

## Phase 5: API Routes

### 5.1 Create Industries API Route

Create `src/app/api/industries/route.ts`:

````typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Sync } from '@/lib/server';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get available industries
    const industries = await Sync.IndustryPreference._getAvailableIndustries({});

    return NextResponse.json({ industries });
  } catch (error: any) {
    console.error('[API] Failed to fetch industries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    );
  }
}
````

### 5.2 Update Profile API Route

Update route.ts:

````typescript
// ...existing imports...
import { Sync } from '@/lib/server';

export async function GET(request: NextRequest) {
  try {
    // ...existing authentication...

    // Get user profile
    const profiles = await Sync.Profile._getByUserId({ userId: user.id });
    const profile = profiles[0];

    // Get industry preferences
    const preferences = await Sync.IndustryPreference._getByUserId({ 
      userId: user.id 
    });

    const combinedProfile = {
      id: user.id,
      email: user.email || '',
      name: user.name || '',
      role: userRoles[0]?.role || 'learner',
      image: user.image,
      bio: profile?.bio,
      linkedinUrl: profile?.linkedinUrl,
      website: profile?.website,
      industryPreferences: preferences.map(p => p.industry) // Add this line
    };

    return NextResponse.json({ profile: combinedProfile });
  } catch (error) {
    // ...existing error handling...
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ...existing authentication...

    const body = await request.json();

    // Handle profile updates
    // ...existing profile update code...

    // Handle industry preferences update
    if (body.industryPreferences !== undefined) {
      const prefResult = await Sync.IndustryPreference.setPreferences({
        userId: user.id,
        industries: body.industryPreferences || []
      });

      if ('error' in prefResult) {
        return NextResponse.json(
          { error: prefResult.error },
          { status: 400 }
        );
      }
    }

    // Fetch updated profile with preferences
    const profiles = await Sync.Profile._getByUserId({ userId: user.id });
    const profile = profiles[0];
    const preferences = await Sync.IndustryPreference._getByUserId({ 
      userId: user.id 
    });

    const updatedProfile = {
      id: user.id,
      email: user.email || '',
      name: body.name || user.name || '',
      role: userRoles[0]?.role || 'learner',
      image: user.image,
      bio: profile?.bio,
      linkedinUrl: profile?.linkedinUrl,
      website: profile?.website,
      industryPreferences: preferences.map(p => p.industry)
    };

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    // ...existing error handling...
  }
}
````

## Phase 6: Frontend Updates

### 6.1 Update Profile Page Types

Update page.tsx:

````typescript
// ...existing imports...

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  bio?: string;
  linkedinUrl?: string;
  website?: string;
  industryPreferences?: string[]; // Add this line
}
````

### 6.2 Add Industry Selection to Profile Page

Add to the profile page component:

````typescript
export default function LearnerProfilePage() {
  // ...existing state...
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAvailableIndustries();
  }, []);

  const fetchAvailableIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const res = await fetch('/api/industries');
      if (res.ok) {
        const data = await res.json();
        setAvailableIndustries(data.industries || []);
      }
    } catch (error) {
      console.error('Failed to fetch industries:', error);
    } finally {
      setLoadingIndustries(false);
    }
  };

  // ...existing code...

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ...existing navigation and header... */}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ...existing sections... */}

        {/* Industry Preferences Section - Add after Professional Links */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Industry Preferences
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select industries you're interested in. Projects from these industries will be highlighted and prioritized for you.
          </p>

          {editing ? (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={industrySearchTerm}
                  onChange={(e) => setIndustrySearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Industry Selection Grid */}
              {loadingIndustries ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {availableIndustries
                    .filter(industry => 
                      industry.toLowerCase().includes(industrySearchTerm.toLowerCase())
                    )
                    .map(industry => {
                      const isSelected = editedProfile.industryPreferences?.includes(industry);
                      return (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => {
                            const current = editedProfile.industryPreferences || [];
                            if (isSelected) {
                              setEditedProfile({
                                ...editedProfile,
                                industryPreferences: current.filter(i => i !== industry)
                              });
                            } else {
                              setEditedProfile({
                                ...editedProfile,
                                industryPreferences: [...current, industry]
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {industry}
                          {isSelected && (
                            <span className="ml-1">✓</span>
                          )}
                        </button>
                      );
                    })}
                  {availableIndustries.filter(industry => 
                    industry.toLowerCase().includes(industrySearchTerm.toLowerCase())
                  ).length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 py-4 w-full text-center">
                      No industries found matching "{industrySearchTerm}"
                    </p>
                  )}
                </div>
              )}

              {/* Selection Counter */}
              {editedProfile.industryPreferences && editedProfile.industryPreferences.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Selected: {editedProfile.industryPreferences.length} {editedProfile.industryPreferences.length === 1 ? 'industry' : 'industries'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditedProfile({ ...editedProfile, industryPreferences: [] })}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.industryPreferences && profile.industryPreferences.length > 0 ? (
                profile.industryPreferences.map(industry => (
                  <span
                    key={industry}
                    className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {industry}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No industries selected. Edit your profile to add industry preferences.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ...rest of existing sections... */}
      </div>
    </div>
  );
}
````

## Phase 7: Projects Page Enhancement

### 7.1 Update LearnerPage to Use Preferences

Update LearnerPage.tsx:

````typescript
export default function ProjectsPage() {
  // ...existing state...
  const [userIndustryPreferences, setUserIndustryPreferences] = useState<string[]>([]);

  useEffect(() => {
    // ...existing code...
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUserIndustryPreferences(data.profile?.industryPreferences || []);
      }
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
    }
  };

  // Modify fetchIndustryStats to sort by preferences
  const fetchIndustryStats = async () => {
    try {
      // ...existing code...
      
      // After getting stats, sort by user preferences
      if (data.stats) {
        const sortedStats = [...data.stats].sort((a: IndustryStats, b: IndustryStats) => {
          const aIsPreferred = userIndustryPreferences.includes(a.industry);
          const bIsPreferred = userIndustryPreferences.includes(b.industry);
          
          if (aIsPreferred && !bIsPreferred) return -1;
          if (!aIsPreferred && bIsPreferred) return 1;
          return b.count - a.count; // Secondary sort by count
        });
        
        setIndustryStats(sortedStats);
        // ...rest of existing code...
      }
    } catch (error) {
      // ...existing error handling...
    }
  };

  // When rendering industry sections, add visual indicators
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ...existing code... */}
      
      {industryStats.map((stat) => {
        const isPreferred = userIndustryPreferences.includes(stat.industry);
        const section = industrySections[stat.industry];
        
        return (
          <div 
            key={stat.industry} 
            data-industry={stat.industry}
            className={isPreferred ? 'relative' : ''}
          >
            {/* Add preference indicator */}
            {isPreferred && (
              <div className="absolute -top-2 left-0 z-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-semibold shadow-lg">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Your Interest
                </span>
              </div>
            )}
            
            <div className={`mb-12 ${isPreferred ? 'pt-6' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {stat.industry} 
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    ({stat.count} {stat.count === 1 ? 'project' : 'projects'})
                  </span>
                  {isPreferred && (
                    <div className="group relative">
                      <span className="text-blue-600 dark:text-blue-400">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        This is one of your preferred industries
                      </span>
                    </div>
                  )}
                </h2>
                {/* ...existing code... */}
              </div>
              {/* ...rest of section rendering... */}
            </div>
          </div>
        );
      })}
      
      {/* ...existing code... */}
    </div>
  );
}
````

## Phase 8: Testing Checklist

### 8.1 Database Tests
- [ ] Verify IndustryPreference table created
- [ ] Test unique constraint on userId + industry
- [ ] Test cascade delete when user is deleted

### 8.2 API Tests
- [ ] GET `/api/industries` returns list of industries
- [ ] GET `/api/profile` includes industryPreferences
- [ ] PUT `/api/profile` with industryPreferences updates correctly
- [ ] Test with empty industryPreferences array (should clear)

### 8.3 UI Tests
- [ ] Profile page shows industry selection when editing
- [ ] Search filter works in industry selection
- [ ] Selected industries persist after save
- [ ] Clear all button works
- [ ] Projects page shows preference indicators
- [ ] Preferred industries appear first in projects list

### 8.4 Edge Cases
- [ ] Handle user with no preferences
- [ ] Handle duplicate industries in request
- [ ] Handle empty/whitespace industry names
- [ ] Test with 20+ industry selections
- [ ] Test concurrent updates from multiple sessions

## Phase 9: Deployment Steps

1. **Update Environment**
   ```bash
   # Ensure DATABASE_URL is set correctly
   npm run db:push
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Verify in Production**
   - Check database migrations applied
   - Test with a test user account
   - Monitor error logs

## Future Enhancements

### Recommendation System
- Use industry preferences for ML-based recommendations
- Weight projects by preference match score
- Send notifications for new projects in preferred industries

### Analytics
- Track which industries users prefer most
- Analyze correlation between preferences and applications
- Generate insights for industry partners

### Advanced Features
- Sub-industry categories
- Skill-based matching within industries
- Industry preference strength (high/medium/low interest)
- Time-based preferences (seasonal interests)

## Troubleshooting Guide

### Common Issues

1. **Industries not showing in profile**
   - Check `/api/industries` endpoint returns data
   - Verify projects have industry field populated
   - Check console for API errors

2. **Preferences not saving**
   - Verify PUT `/api/profile` includes x-user-id header
   - Check Prisma schema is synced
   - Look for unique constraint violations

3. **Projects not prioritizing preferences**
   - Ensure preferences are fetched on page load
   - Check sorting logic in fetchIndustryStats
   - Verify userIndustryPreferences state is populated

## Support Documentation

For additional help:
- Review Concept Design Documentation
- Check Database Schema
- See API Route Patterns

## Completion Checklist

- [ ] Phase 1: Database schema updated
- [ ] Phase 2: Concept specification created
- [ ] Phase 3: Concept implementation complete
- [ ] Phase 4: Synchronizations implemented
- [ ] Phase 5: API routes updated
- [ ] Phase 6: Profile page updated
- [ ] Phase 7: Projects page enhanced
- [ ] Phase 8: Testing complete
- [ ] Phase 9: Deployed to production

---

This implementation follows the Concept Design architecture, maintaining independence between concepts while providing a seamless user experience for industry preference management.