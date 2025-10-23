import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuthBridge } from '@/lib/auth-bridge';
import { sendEmail } from '@/lib/email-service';

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

    // Update application status using raw SQL to bypass Prisma type issues
    await prisma.$executeRaw`
      UPDATE project_application 
      SET status = ${status},
          "reviewedAt" = NOW(),
          "reviewedBy" = ${session.user.email},
          "updatedAt" = NOW()
      WHERE id = ${params.id}
    `;

    // Fetch the updated application
    const application = await prisma.projectApplication.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            title: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Send email notification to learner
    try {
      const isApproved = status === 'approved';
      const statusText = isApproved ? 'approved' : 'rejected';
      const statusColor = isApproved ? '#10b981' : '#ef4444';
      const statusEmoji = isApproved ? '✅' : '❌';

      await sendEmail({
        to: application.applicantEmail,
        subject: `Your application for "${application.project.title}" has been ${statusText}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #2563eb;">ProjectHub</h2>
            <p>Hello,</p>
            <p>Your application for the project <strong>"${application.project.title}"</strong> has been reviewed.</p>
            
            <div style="background: ${isApproved ? '#d1fae5' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <h2 style="margin: 0; color: ${statusColor};">
                ${statusEmoji} Application ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
              </h2>
            </div>

            ${isApproved 
              ? `<p>Congratulations! You can now start working on this project. Visit your dashboard to get started.</p>`
              : `<p>Unfortunately, your application was not approved at this time. Please feel free to apply to other projects that match your interests and skills.</p>`
            }

            <div style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/projects/${application.projectId}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Project
              </a>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              Reviewed by: ${session.user.email}<br>
              Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent from ProjectHub. Please do not reply to this email.
            </p>
          </div>
        `,
        text: `
Your application for "${application.project.title}" has been ${statusText}.

${isApproved 
  ? 'Congratulations! You can now start working on this project. Visit your dashboard to get started.'
  : 'Unfortunately, your application was not approved at this time. Please feel free to apply to other projects that match your interests and skills.'
}

View Project: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/projects/${application.projectId}

Reviewed by: ${session.user.email}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        `.trim()
      });

      console.log(`✉️ Notification email sent to ${application.applicantEmail} for ${statusText} application`);
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send notification email:', emailError);
    }

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
