import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProjectPreferenceConcept } from '@/lib/concepts/project/project-preference';
import { headers } from 'next/headers';

const projectPreferenceConcept = new ProjectPreferenceConcept();

/**
 * GET /api/project-preferences
 * Get user's project preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await projectPreferenceConcept.getUserPreferences({
      userId: session.user.id
    });

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/project-preferences
 * Set user's project preferences (max 5, ranked 1-5)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = await projectPreferenceConcept.setPreferences({
      userId: session.user.id,
      preferences: body.preferences
    });

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error setting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to set preferences' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/project-preferences
 * Clear all user's project preferences
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await projectPreferenceConcept.clearUserPreferences({
      userId: session.user.id
    });

    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error clearing preferences:', error);
    return NextResponse.json(
      { error: 'Failed to clear preferences' },
      { status: 500 }
    );
  }
}
