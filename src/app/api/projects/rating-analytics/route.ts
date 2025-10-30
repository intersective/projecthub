import { ProjectRating } from "@/lib/server";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user has admin/manager/educator role
    const membership = await prisma.membership.findFirst({
      where: {
        memberEntityType: "User",
        memberEntityId: session.user.id,
        isActive: true
      }
    });

    // For now, allow any authenticated user - can add stricter role check later
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const limit = searchParams.get('limit');
    
    const analytics = await ProjectRating._getProjectAnalytics({
      campaignId: campaignId || undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    return Response.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching rating analytics:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
