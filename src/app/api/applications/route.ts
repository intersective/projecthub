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

    // Get all applications for the current user with project details
    const applications = await prisma.projectApplication.findMany({
      where: {
        applicantEmail: userEmail
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            image: true,
            industry: true,
            domain: true,
            difficulty: true,
            estimatedHours: true,
            status: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    // Transform the data to match the expected interface
    const transformedApplications = applications.map(app => ({
      id: app.id,
      projectId: app.projectId,
      projectTitle: app.project.title,
      projectImage: app.project.image,
      projectIndustry: app.project.industry,
      projectDomain: app.project.domain,
      projectDifficulty: app.project.difficulty,
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      estimatedHours: app.project.estimatedHours
    }));

    return NextResponse.json({ 
      success: true,
      applications: transformedApplications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}