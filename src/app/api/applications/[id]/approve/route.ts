import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuthBridge } from '@/lib/auth-bridge';

/**
 * POST /api/applications/[id]/approve
 * Approve or reject a project application (Expert/Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has expert, educator, manager, or admin role
    const hasApprovalRole = await AuthBridge.hasRole(request, [
      'expert',
      'educator', 
      'manager',
      'platform_admin'
    ]);

    if (!hasApprovalRole) {
      return NextResponse.json(
        { error: 'Forbidden - Only experts, educators, managers, or admins can approve applications' }, 
        { status: 403 }
      );
    }

    const { status } = await request.json();

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Update application status
    const application = await prisma.projectApplication.update({
      where: { id: params.id },
      data: { 
        status,
        reviewedAt: new Date() as any,
        reviewedBy: session.user.email as any
      } as any,
      include: {
        project: {
          select: {
            title: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      application: {
        id: application.id,
        status: application.status,
        reviewedAt: (application as any).reviewedAt,
        reviewedBy: (application as any).reviewedBy,
        projectTitle: application.project.title
      }
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    );
  }
}
