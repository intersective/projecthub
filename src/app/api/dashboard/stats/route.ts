import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from '@/lib/auth';

/**
 * GET /api/dashboard/stats
 * Fetches comprehensive dashboard statistics for managers
 * Requires: platform_admin, educator, expert, or provider role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No user session found' },
        { status: 401 }
      );
    }

    // Fetch all statistics in parallel for better performance
    const [
      totalCampaigns,
      activeCampaigns,
      totalTeams,
      activeTeams,
      totalProjects,
      totalPartners,
      totalExperts,
      totalAssignments,
      pendingApplications,
    ] = await Promise.all([
      // Campaign counts
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'active' } }),
      
      // Team counts
      prisma.team.count(),
      prisma.team.count({ where: { status: 'active' } }),
      
      // Project count
      prisma.project.count(),
      
      // Partner/provider count
      prisma.organization.count({
        where: {
          organizationType: {
            in: ['partner', 'provider']
          }
        }
      }),
      
      // Expert count (active profiles)
      prisma.profile.count({
        where: {
          profileType: 'expert',
          isActive: true
        }
      }),
      
      // Assignment count
      prisma.assignment.count(),
      
      // Pending applications
      prisma.projectApplication.count({
        where: { status: 'pending' }
      }),
    ]);

    const stats = {
      totalCampaigns,
      activeCampaigns,
      totalTeams,
      activeTeams,
      totalProjects,
      totalPartners,
      totalExperts,
      totalAssignments,
      pendingApplications,
    };

    return NextResponse.json({
      success: true,
      ...stats
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics' 
      },
      { status: 500 }
    );
  }
}
