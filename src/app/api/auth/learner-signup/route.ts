import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Assigns learner role and campaign membership to an existing user
 * This endpoint is called after Better Auth creates the user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Learner Role Assignment] Processing for user:', user.id, user.email);

    // Find or create the learner role
    let learnerRole = await prisma.role.findFirst({
      where: { 
        displayName: { equals: 'Learner', mode: 'insensitive' }
      }
    });

    if (!learnerRole) {
      console.log('[Learner Role Assignment] Creating learner role');
      learnerRole = await prisma.role.create({
        data: {
          displayName: 'Learner',
          description: 'Learner role with access to view and apply to projects',
          scope: 'campaign',
          permissions: {
            projects: { read: true, apply: true },
            profile: { read: true, update: true },
          },
        },
      });
    }

    // Get the user's organization (if they have one from auto-registration)
    const domain = user.email.split('@')[1];
    const organization = await prisma.organization.findFirst({ 
      where: { domain } 
    });

    // Create or update organization membership
    if (organization && learnerRole) {
      const existingOrgMembership = await prisma.membership.findFirst({
        where: {
          memberEntityType: 'user',
          memberEntityId: user.id,
          targetEntityType: 'organization',
          targetEntityId: organization.id,
        },
      });

      if (existingOrgMembership) {
        console.log('[Learner Role Assignment] Updating organization membership');
        await prisma.membership.update({
          where: { id: existingOrgMembership.id },
          data: { roleEntityId: learnerRole.id },
        });
      } else {
        console.log('[Learner Role Assignment] Creating organization membership');
        await prisma.membership.create({
          data: {
            memberEntityType: 'user',
            memberEntityId: user.id,
            targetEntityType: 'organization',
            targetEntityId: organization.id,
            roleEntityId: learnerRole.id,
            invitedBy: 'system',
            invitedAt: new Date(),
            approvedBy: 'system',
            approvedAt: new Date(),
            status: 'active',
            isActive: true,
            joinedAt: new Date(),
          },
        });
      }
    }

    // Get default campaign and create campaign membership
    const defaultCampaign = await prisma.campaign.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (defaultCampaign && learnerRole) {
      const existingCampaignMembership = await prisma.membership.findFirst({
        where: {
          memberEntityType: 'user',
          memberEntityId: user.id,
          targetEntityType: 'campaign',
          targetEntityId: defaultCampaign.id,
        },
      });

      if (!existingCampaignMembership) {
        console.log('[Learner Role Assignment] Creating campaign membership');
        await prisma.membership.create({
          data: {
            memberEntityType: 'user',
            memberEntityId: user.id,
            targetEntityType: 'campaign',
            targetEntityId: defaultCampaign.id,
            roleEntityId: learnerRole.id,
            invitedBy: 'system',
            invitedAt: new Date(),
            approvedBy: 'system',
            approvedAt: new Date(),
            status: 'active',
            isActive: true,
            joinedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Learner role assigned successfully',
    });

  } catch (error: any) {
    console.error('[Learner Role Assignment] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Role assignment failed' },
      { status: 500 }
    );
  }
}
