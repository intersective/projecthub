import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { UserConcept } from '@/lib/concepts/common/user';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userConcept = new UserConcept();
    
    const result = await userConcept.create({
      name: body.name,
      email: body.email
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userConcept = new UserConcept();
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    const users = await userConcept.search({ q: query });

    if ('error' in users) {
      return NextResponse.json({ error: users.error }, { status: 400 });
    }

    return NextResponse.json(users.users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
