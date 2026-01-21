import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ProjectConcept } from '@/lib/concepts/project/project';

interface IndustryStats {
  industry: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for either organization or campaign context
    const organizationId = session.currentContext?.organizationId;
    const campaignId = session.currentContext?.campaignId;
    
    if (!organizationId && !campaignId) {
      return NextResponse.json({ success: false, error: 'No organization or campaign context' }, { status: 400 });
    }

    // Parse filters from query params
    const url = new URL(request.url);
    const filters: any = {};
    const industry = url.searchParams.get('industry');
    const domain = url.searchParams.get('domain');
    const status = url.searchParams.get('status');
    const difficulty = url.searchParams.get('difficulty');
    const duration = url.searchParams.get('duration');

    if (industry) filters.industry = industry;
    if (domain) filters.domain = domain;
    if (status) filters.status = status;
    if (difficulty) filters.difficulty = difficulty;
    
    // Parse duration filter
    if (duration) {
        if (duration === '40+') {
            filters.estimatedHoursMin = 40;
        } else {
            const [min, max] = duration.split('-').map(Number);
            if (!isNaN(min)) filters.estimatedHoursMin = min;
            if (!isNaN(max)) filters.estimatedHoursMax = max;
        }
    }

    const projectConcept = new ProjectConcept();
    
    // Use campaign-based query if user has campaign context (learners)
    // Otherwise use organization-based query (managers/educators)
    const stats = campaignId 
      ? await projectConcept._getIndustryCountByCampaign({ 
          campaignId,
          filters: Object.keys(filters).length > 0 ? filters : undefined
        })
      : await projectConcept._getIndustryCountByOrganization({ 
          organizationId: organizationId!,
          filters: Object.keys(filters).length > 0 ? filters : undefined
        });
    console.log("Stats", stats);
    // sort and filter out industries that have count = 0
    const sortedStats = stats.sort((a: { count: number }, b: { count: number }) => b.count - a.count).filter((stat: { count: number }) => stat.count > 0);
    console.log(sortedStats);

    return NextResponse.json({
      success: true,
      stats,
      totalIndustries: stats.length,
      totalProjects: stats.reduce((sum: number, stat: { count: number }) => sum + stat.count, 0),
    });

  } catch (error) {
    console.error('Error fetching industry stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
