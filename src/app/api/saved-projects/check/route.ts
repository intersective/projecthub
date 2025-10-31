import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SavedProjectConcept } from '@/lib/concepts/project/saved-project';
import { headers } from 'next/headers';

const savedProjectConcept = new SavedProjectConcept();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const isSaved = await savedProjectConcept._isSaved({
      userId: session.user.id,
      projectId
    });

    return NextResponse.json({ isSaved });
  } catch (error) {
    console.error('Error in saved-projects check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
