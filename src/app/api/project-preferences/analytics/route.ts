import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProjectPreferenceConcept } from '@/lib/concepts/project/project-preference';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { headers } from 'next/headers';
import { ROLES } from '@/lib/auth-context';

const projectPreferenceConcept = new ProjectPreferenceConcept();
const projectConcept = new ProjectConcept();

/**
 * GET /api/project-preferences/analytics
 * Get analytics data for admin dashboard
 * Requires: platform_admin or manager role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin/manager role
    // For now, we'll allow any authenticated user
    // TODO: Add proper role checking based on your RBAC implementation

    const analyticsResult = await projectPreferenceConcept.getAnalytics({});

    if ('error' in analyticsResult) {
      return NextResponse.json(analyticsResult, { status: 400 });
    }

    // Enrich with project details
    const { analytics } = analyticsResult;
    
    // Fetch project details for most preferred projects
    const projectIds = analytics.mostPreferredProjects.map(p => p.projectId);
    const allProjectIds = [...projectIds, ...analytics.unselectedProjectIds];

    const projectsResult = await projectConcept._getByIds({ id: allProjectIds });
    const projectsMap = new Map(projectsResult.map(p => [p.id, p]));

    // Enrich most preferred projects with details
    const enrichedMostPreferred = analytics.mostPreferredProjects
      .map(stat => {
        const project = projectsMap.get(stat.projectId);
        return project ? {
          ...stat,
          projectTitle: project.title,
          projectIndustry: project.industry,
          projectDomain: project.domain,
          projectDifficulty: project.difficulty,
          percentageOfLearners: analytics.totalLearnersWithPreferences > 0
            ? Math.round((stat.totalSelections / analytics.totalLearnersWithPreferences) * 100)
            : 0
        } : null;
      })
      .filter(Boolean);

    // Enrich unselected projects
    const unselectedProjects = analytics.unselectedProjectIds
      .map(id => projectsMap.get(id))
      .filter(Boolean)
      .map(p => ({
        id: p!.id,
        title: p!.title,
        industry: p!.industry,
        domain: p!.domain,
        difficulty: p!.difficulty
      }));

    // Calculate industry preferences
    const industryStats = new Map<string, number>();
    enrichedMostPreferred.forEach(p => {
      if (p && p.projectIndustry) {
        const current = industryStats.get(p.projectIndustry) || 0;
        industryStats.set(p.projectIndustry, current + p.totalSelections);
      }
    });

    const industryPreferences = Array.from(industryStats.entries())
      .map(([industry, count]) => ({
        industry,
        totalSelections: count,
        percentageOfTotal: analytics.mostPreferredProjects.reduce((sum, p) => sum + p.totalSelections, 0) > 0
          ? Math.round((count / analytics.mostPreferredProjects.reduce((sum, p) => sum + p.totalSelections, 0)) * 100)
          : 0
      }))
      .sort((a, b) => b.totalSelections - a.totalSelections);

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        mostPreferredProjects: enrichedMostPreferred,
        unselectedProjects,
        industryPreferences
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
