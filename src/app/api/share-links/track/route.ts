import { NextRequest, NextResponse } from 'next/server';
import { ShareLinkConcept } from '@/lib/concepts/common/share-link';

const shareLinkConcept = new ShareLinkConcept();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }

    const result = await shareLinkConcept.trackClick({ code });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, shareLink: result.shareLink });
  } catch (error) {
    console.error('Error tracking share click:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
