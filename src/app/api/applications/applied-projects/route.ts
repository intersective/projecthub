import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * GET /api/applications/applied-projects
 * Returns a list of project IDs that the current user has applied to
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Get all project IDs the user has applied to
    const applications = await prisma.projectApplication.findMany({
      where: {
        applicantEmail: userEmail
      },
      select: {
        projectId: true,
        status: true
      }
    });

    // Create a map of projectId to application status
    const appliedProjects = applications.reduce((acc, app) => {
      acc[app.projectId] = app.status;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ 
      success: true,
      appliedProjects
    });

  } catch (error) {
    console.error('Error fetching applied projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applied projects' },
      { status: 500 }
    );
  }
}
