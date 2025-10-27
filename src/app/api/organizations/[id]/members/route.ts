import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { MembershipConcept } from '@/lib/concepts/common/membership';
import { UserConcept } from '@/lib/concepts/common/user';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch memberships with user and role details using Prisma
    const memberships = await prisma.membership.findMany({
      where: {
        targetEntityType: 'organization',
        targetEntityId: id
      }
    });

    // Manually fetch related user and role data
    const enrichedMembers = await Promise.all(
      memberships.map(async (membership) => {
        let memberInfo = null;
        let roleInfo = null;

        // Fetch user info if member is a user
        if (membership.memberEntityType === 'user') {
          const user = await prisma.user.findUnique({
            where: { id: membership.memberEntityId },
            select: { id: true, name: true, email: true, image: true }
          });
          memberInfo = user;
        }

        // Fetch role info
        const role = await prisma.role.findUnique({
          where: { id: membership.roleEntityId },
          select: { id: true, displayName: true, description: true }
        });
        roleInfo = role;

        return {
          ...membership,
          memberInfo,
          roleInfo
        };
      })
    );
    
    return NextResponse.json(enrichedMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const membershipConcept = new MembershipConcept();
    
    // If creating a new user, do that first
    if (body.createUser) {
      const userConcept = new UserConcept();
      const userResult = await userConcept.create({
        name: body.name,
        email: body.email
      });
      
      if ('error' in userResult) {
        return NextResponse.json({ error: userResult.error }, { status: 400 });
      }
      
      body.memberEntity = userResult.user.id;
    }
    
    const result = await membershipConcept.invite({
      memberEntityType: 'user',
      memberEntityId: body.memberEntity,
      roleEntityId: body.roleEntity || 'org_member',
      targetEntityType: 'organization',
      targetEntityId: id,
      invitedBy: session.user.id
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.membership, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
