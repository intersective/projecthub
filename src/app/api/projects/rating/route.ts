import { ProjectRating } from "@/lib/server";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, rating, campaignId } = body;
    
    const result = await ProjectRating.setRating({
      userId: session.user.id,
      projectId,
      rating,
      campaignId
    });

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true, rating: result.rating });
  } catch (error) {
    console.error('Error in rating API:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, campaignId } = body;
    
    const result = await ProjectRating.removeRating({
      userId: session.user.id,
      projectId,
      campaignId
    });

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error removing rating:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
