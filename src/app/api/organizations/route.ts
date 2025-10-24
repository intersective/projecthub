import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { OrganizationConcept } from '@/lib/concepts/common/organization';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationConcept = new OrganizationConcept();
    const organizations = await organizationConcept._getAll({});
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const organizationConcept = new OrganizationConcept();
    
    const result = await organizationConcept.create({
      name: body.name,
      description: body.description,
      domain: body.domain,
      type: body.type || 'education',
      contactEmail: body.contactEmail || session.user.email,
      website: body.website
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
