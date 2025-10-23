import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuthBridge } from '@/lib/auth-bridge';

/**
 * GET /api/applications/all
 * Get all applications for managers/experts/educators/admins to review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has manager/expert/educator/admin role
    const hasReviewRole = await AuthBridge.hasRole(request, [
      'expert',
      'educator', 
      'manager',
      'platform_admin'
    ]);

    if (!hasReviewRole) {
      return NextResponse.json(
        { error: 'Forbidden - Only experts, educators, managers, or admins can view all applications' }, 
        { status: 403 }
      );
    }

    // Fetch all applications with project details
    const applications = await prisma.projectApplication.findMany({
      include: {
        project: {
          select: {
            title: true,
            industry: true,
            domain: true,
            difficulty: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { appliedAt: 'desc' } // newest first
      ]
    });

    return NextResponse.json({ 
      success: true,
      applications 
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
