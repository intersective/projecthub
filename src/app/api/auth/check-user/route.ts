import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Check if a user exists by email
 * Used by login flow to redirect to registration if user doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    return NextResponse.json({
      exists: !!user,
      email: email.toLowerCase().trim(),
    });

  } catch (error: any) {
    console.error('[Check User] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user' },
      { status: 500 }
    );
  }
}
