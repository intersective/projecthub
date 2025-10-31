import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SavedProjectConcept } from '@/lib/concepts/project/saved-project';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { headers } from 'next/headers';

const savedProjectConcept = new SavedProjectConcept();
const projectConcept = new ProjectConcept();

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, notes } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const result = await savedProjectConcept.save({
      userId: session.user.id,
      projectId,
      notes
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, savedProject: result.savedProject });
  } catch (error) {
    console.error('Error in saved-projects POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const result = await savedProjectConcept.unsave({
      userId: session.user.id,
      projectId
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in saved-projects DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedProjects = await savedProjectConcept._getByUser({
      userId: session.user.id
    });

    // Fetch full project details for each saved project
    const projectIds = savedProjects.map(sp => sp.projectId);
    const projects = await projectConcept._getByIds({ id: projectIds });

    // Combine saved projects with project details
    const result = savedProjects.map(sp => {
      const project = projects.find(p => p.id === sp.projectId);
      return {
        ...sp,
        project
      };
    });

    return NextResponse.json({ savedProjects: result });
  } catch (error) {
    console.error('Error in saved-projects GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
