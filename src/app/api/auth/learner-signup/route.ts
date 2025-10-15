import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * Assigns learner role and campaign membership to an existing user
 * This endpoint is called after Better Auth creates the user
 * It also creates a session with proper context
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

    // Check if user already has learner role assigned
    const existingLearnerMembership = await prisma.membership.findFirst({
      where: {
        memberEntityType: 'user',
        memberEntityId: user.id,
        targetEntityType: 'campaign',
        isActive: true,
      },
    });

    if (existingLearnerMembership) {
      const existingRole = await prisma.role.findUnique({
        where: { id: existingLearnerMembership.roleEntityId }
      });
      
      if (existingRole?.displayName?.toLowerCase() === 'learner') {
        console.log('[Learner Role Assignment] User already has learner role, checking session');
        
        // Check if session exists
        const existingSession = await prisma.session.findFirst({
          where: { userId: user.id, isActive: true }
        });

        if (existingSession) {
          console.log('[Learner Role Assignment] Session already exists, returning success');
          return NextResponse.json({
            success: true,
            message: 'Learner role already assigned',
            alreadyExists: true,
          });
        }
        // If no session, continue to create one
        console.log('[Learner Role Assignment] No session found, will create one');
      }
    }

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

    // Delete any existing sessions for this user to ensure clean state
    console.log('[Learner Role Assignment] Deleting existing sessions');
    await prisma.session.deleteMany({ 
      where: { userId: user.id } 
    });

    // Create session context for the user
    console.log('[Learner Role Assignment] Creating session context');
    
    // Determine role for session
    let currentRole = 'learner';
    if (learnerRole?.displayName) {
      currentRole = learnerRole.displayName.toLowerCase().replace(/\s+/g, '_');
    }

    // Build session context
    const context: Record<string, any> = { currentRole };
    if (organization) {
      context.organizationId = organization.id;
    }
    if (defaultCampaign) {
      context.campaignId = defaultCampaign.id;
    }

    // Generate session token
    const sessionToken = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create concept session
    const session = await prisma.session.create({
      data: {
        sessionKey: sessionToken,
        userId: user.id,
        currentContext: JSON.stringify(context),
        loginMethod: 'email-otp',
        isActive: true,
      },
    });

    console.log('[Learner Role Assignment] Session created:', session.id);

    return NextResponse.json({
      success: true,
      message: 'Learner role assigned successfully',
      session: {
        id: session.id,
        context: context,
      },
    });

  } catch (error: any) {
    console.error('[Learner Role Assignment] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Role assignment failed' },
      { status: 500 }
    );
  }
}
