import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ShareLinkConcept } from '@/lib/concepts/common/share-link';
import { headers } from 'next/headers';

const shareLinkConcept = new ShareLinkConcept();

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const result = await shareLinkConcept.createOrGet({
      userId: session.user.id,
      projectId
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Generate full share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (request.headers.get('host') 
                      ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
                      : 'http://localhost:3000');
    
    const shareUrl = `${baseUrl}/projects/shared/${result.shareLink.code}`;

    return NextResponse.json({
      success: true,
      shareLink: result.shareLink,
      shareUrl
    });
  } catch (error) {
    console.error('Error in share-links POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shareLinks = await shareLinkConcept._getByUser({
      userId: session.user.id
    });

    return NextResponse.json({ shareLinks });
  } catch (error) {
    console.error('Error in share-links GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
