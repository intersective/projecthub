import { ProjectRating } from "@/lib/server";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    const ratings = await ProjectRating._getUserRatings({
      userId: session.user.id,
      campaignId: campaignId || undefined
    });

    return Response.json({ success: true, ratings });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
