import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IndustryPreference } from '@/lib/server';

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
    const industries = await IndustryPreference._getAvailableIndustries({});

    return NextResponse.json({ industries });
  } catch (error: any) {
    console.error('[API] Failed to fetch industries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    );
  }
}
