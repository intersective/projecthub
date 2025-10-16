import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Get all applications for the current user
    const applications = await prisma.projectApplication.findMany({
      where: {
        applicantEmail: userEmail
      },
      include: {
        project: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Calculate stats
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
    
    // Count active projects (projects with accepted applications)
    const activeProjects = applications.filter(app => 
      app.status === 'accepted' && app.project.status === 'active'
    ).length;
    
    // Count completed projects (projects with accepted applications that are completed)
    const completedProjects = applications.filter(app => 
      app.status === 'accepted' && app.project.status === 'completed'
    ).length;

    const stats = {
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      activeProjects,
      completedProjects
    };

    return NextResponse.json({ 
      success: true,
      stats 
    });

  } catch (error) {
    console.error('Error fetching application stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application stats' },
      { status: 500 }
    );
  }
}