// handle getting a list of projects for an organization

import { NextRequest, NextResponse } from 'next/server';
import { ProjectConcept } from '@/lib/concepts/project/project';
import { RelationshipConcept } from '@/lib/concepts/common/relationship';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers() // you need to pass the headers object.
    });
    const projectConcept = new ProjectConcept();
    
    // if no session, return 401
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // if no organizationId, return empty array instead of error
    if (!session.currentContext?.organizationId) {
        return NextResponse.json({
            projects: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                hasMore: false,
                totalPages: 0
            }
        });
    }

    // Parse query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    // Support both skip parameter (for offset-based pagination) and page parameter (for page-based pagination)
    const skipParam = url.searchParams.get('skip');
    const skip = skipParam ? parseInt(skipParam) : (page - 1) * limit;

    // Parse filters
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
    
    // Parse duration filter (e.g., "0-10", "10-20", "20-40", "40+")
    if (duration) {
        if (duration === '40+') {
            filters.estimatedHoursMin = 40;
        } else {
            const [min, max] = duration.split('-').map(Number);
            if (!isNaN(min)) filters.estimatedHoursMin = min;
            if (!isNaN(max)) filters.estimatedHoursMax = max;
        }
    }

    try {
        // Get paginated projects
        const result = await projectConcept._getByOrganizationPaginated({
            organizationId: session.currentContext.organizationId,
            skip,
            take: limit,
            filters: Object.keys(filters).length > 0 ? filters : undefined
        });

        return NextResponse.json({
            projects: result.projects,
            pagination: {
                page,
                limit,
                total: result.total,
                hasMore: result.hasMore,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    // if no session, return 401
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // if no organizationId, return 400
    if (!session.currentContext?.organizationId) {
        return NextResponse.json({ 
            error: 'No organization context found. Please select an organization.' 
        }, { status: 400 });
    }

    try {
        const body = await request.json();
        const projectConcept = new ProjectConcept();
        
        // Debug: Log what we're receiving
        console.log('POST /api/projects - Received body:', body);
        console.log('Deliverables received:', body.deliverables);
        console.log('Deliverables type:', typeof body.deliverables, Array.isArray(body.deliverables));
        
        // Generate image URL if not provided
        const seed = `${body.industry}-${body.domain}`.replace(/\s+/g, '-').toLowerCase();
        const finalImageUrl = body.image || `https://picsum.photos/seed/${seed}/600/340`;
        
        // Create the project with organization link
        const result = await projectConcept.create({
            title: body.title,
            description: body.description,
            image: finalImageUrl,
            scope: body.scope || '',
            industry: body.industry,
            domain: body.domain,
            difficulty: body.difficulty,
            estimatedHours: body.estimatedHours,
            deliverables: body.deliverables || [],
            organizationId: session.currentContext.organizationId,
            userId: session.user.id,
        });

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ project: result.project }, { status: 201 });
    } catch (error) {
        console.error('Failed to create project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

