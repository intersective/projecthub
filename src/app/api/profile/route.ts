import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { UserConcept } from '@/lib/concepts/common/user';
import { ProfileConcept } from '@/lib/concepts/common/profile';
import { RelationshipConcept } from '@/lib/concepts/common/relationship';
import { IndustryPreferenceConcept } from '@/lib/concepts/common/industry-preference';

/**
 * GET /api/profile
 * Fetch the current user's profile information
 * Combines data from User table and Profile table (linked via Relationship)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userConcept = new UserConcept();
    const profileConcept = new ProfileConcept();
    const relationshipConcept = new RelationshipConcept();
    const industryPreferenceConcept = new IndustryPreferenceConcept();

    // Get user data
    const users = await userConcept._getById({ id: session.user.id });
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find profile linked to this user via relationship
    const relationships = await relationshipConcept._getByFrom({
      fromEntityType: 'user',
      fromEntityId: user.id,
      relationType: 'has_profile'
    });

    let profile = null;
    if (relationships.length > 0) {
      const profileId = relationships[0].toEntityId;
      const profiles = await profileConcept._getById({ id: profileId });
      profile = profiles[0] || null;
    }

    // Get industry preferences
    const preferences = await industryPreferenceConcept._getByUserId({ 
      userId: user.id 
    });

    // Combine user and profile data
    const combinedProfile = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: session.effectiveRole?.name || 'guest',
      image: user.image,
      bio: profile?.bio || '',
      linkedinUrl: profile?.linkedinUrl || '',
      website: profile?.website || '',
      // Additional profile fields that exist in the Profile table
      title: profile?.title || '',
      company: profile?.company || '',
      timezone: profile?.timezone || 'UTC',
      profileType: profile?.profileType || 'learner',
      industryPreferences: preferences.map(p => p.industry)
    };

    return NextResponse.json({ profile: combinedProfile });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update the current user's profile information
 * Updates both User table (name, image) and Profile table (bio, linkedinUrl, website, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userConcept = new UserConcept();
    const profileConcept = new ProfileConcept();
    const relationshipConcept = new RelationshipConcept();
    const industryPreferenceConcept = new IndustryPreferenceConcept();

    // Get current user
    const users = await userConcept._getById({ id: session.user.id });
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle industry preferences update
    if (body.industryPreferences !== undefined) {
      const prefResult = await industryPreferenceConcept.setPreferences({
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

    // Update user fields (name, image)
    if (body.name !== undefined || body.image !== undefined) {
      const userUpdateResult = await userConcept.updateUser({
        id: user.id,
        name: body.name,
        image: body.image,
      });

      if ('error' in userUpdateResult) {
        return NextResponse.json(
          { error: userUpdateResult.error },
          { status: 400 }
        );
      }
    }

    // Find or create profile
    const relationships = await relationshipConcept._getByFrom({
      fromEntityType: 'user',
      fromEntityId: user.id,
      relationType: 'has_profile'
    });

    let profileId: string;
    let profile;

    if (relationships.length > 0) {
      // Update existing profile
      profileId = relationships[0].toEntityId;
      const profileUpdateResult = await profileConcept.update({
        id: profileId,
        bio: body.bio,
        title: body.title,
        company: body.company,
        linkedinUrl: body.linkedinUrl,
        website: body.website,
        timezone: body.timezone,
        hourlyRate: body.hourlyRate,
      });

      if ('error' in profileUpdateResult) {
        return NextResponse.json(
          { error: profileUpdateResult.error },
          { status: 400 }
        );
      }

      profile = profileUpdateResult.profile;
    } else {
      // Create new profile
      const profileCreateResult = await profileConcept.create({
        profileType: body.profileType || 'learner',
        bio: body.bio || '',
        title: body.title,
        company: body.company,
        timezone: body.timezone || 'UTC',
      });

      if ('error' in profileCreateResult) {
        return NextResponse.json(
          { error: profileCreateResult.error },
          { status: 400 }
        );
      }

      profile = profileCreateResult.profile;
      profileId = profile.id;

      // Create relationship between user and profile
      const relationshipResult = await relationshipConcept.link({
        fromEntityType: 'user',
        fromEntityId: user.id,
        toEntityType: 'profile',
        toEntityId: profileId,
        relationType: 'has_profile',
      });

      if ('error' in relationshipResult) {
        console.error('Failed to create user-profile relationship:', relationshipResult.error);
        // Continue anyway - profile was created successfully
      }

      // Now update with additional fields
      if (body.linkedinUrl || body.website || body.hourlyRate !== undefined) {
        const updateResult = await profileConcept.update({
          id: profileId,
          linkedinUrl: body.linkedinUrl,
          website: body.website,
          hourlyRate: body.hourlyRate,
        });

        if ('error' in updateResult) {
          console.error('Failed to update profile with additional fields:', updateResult.error);
        } else {
          profile = updateResult.profile;
        }
      }
    }

    // Get updated user data
    const updatedUsers = await userConcept._getById({ id: user.id });
    const updatedUser = updatedUsers[0];

    // Get updated industry preferences
    const updatedPreferences = await industryPreferenceConcept._getByUserId({ 
      userId: user.id 
    });

    // Combine and return updated profile
    const combinedProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || '',
      role: session.effectiveRole?.name || 'guest',
      image: updatedUser.image,
      bio: profile?.bio || '',
      linkedinUrl: profile?.linkedinUrl || '',
      website: profile?.website || '',
      title: profile?.title || '',
      company: profile?.company || '',
      timezone: profile?.timezone || 'UTC',
      profileType: profile?.profileType || 'learner',
      industryPreferences: updatedPreferences.map(p => p.industry)
    };

    return NextResponse.json({ profile: combinedProfile });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
