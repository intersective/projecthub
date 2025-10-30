import { prisma } from "@/lib/prisma";

export interface ProjectRating {
  id: string;
  userId: string;
  projectId: string;
  rating: number;
  campaignId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingAnalytics {
  projectId: string;
  projectTitle: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
  topRatedBy: number;
}

export class ProjectRatingConcept {
  async setRating(input: {
    userId: string;
    projectId: string;
    rating: number;
    campaignId?: string;
  }): Promise<{ rating: ProjectRating } | { error: string }> {
    // Validate rating range
    if (input.rating < 1 || input.rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    try {
      // Check if user exists and has learner role
      const user = await prisma.user.findUnique({
        where: { id: input.userId }
      });

      if (!user) {
        return { error: "User not found" };
      }

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) {
        return { error: "Project not found" };
      }

      // Verify user has an active membership (basic check - learner verification can be done at API level)
      const hasActiveMembership = await prisma.membership.findFirst({
        where: {
          memberEntityType: "User",
          memberEntityId: input.userId,
          isActive: true
        }
      });

      if (!hasActiveMembership) {
        return { error: "User must have an active membership to rate projects" };
      }

      // Upsert rating
      const rating = await prisma.projectRating.upsert({
        where: {
          userId_projectId_campaignId: {
            userId: input.userId,
            projectId: input.projectId,
            campaignId: input.campaignId || null
          }
        },
        update: {
          rating: input.rating,
        },
        create: {
          userId: input.userId,
          projectId: input.projectId,
          rating: input.rating,
          campaignId: input.campaignId || null,
        }
      });

      return { rating };
    } catch (error) {
      console.error('Error setting rating:', error);
      return { error: `Failed to set rating: ${error}` };
    }
  }

  async removeRating(input: {
    userId: string;
    projectId: string;
    campaignId?: string;
  }): Promise<{} | { error: string }> {
    try {
      await prisma.projectRating.delete({
        where: {
          userId_projectId_campaignId: {
            userId: input.userId,
            projectId: input.projectId,
            campaignId: input.campaignId || null
          }
        }
      });
      return {};
    } catch (error) {
      console.error('Error removing rating:', error);
      return { error: `Failed to remove rating: ${error}` };
    }
  }

  async updateUserRatings(input: {
    userId: string;
    ratings: Array<{ projectId: string; rating: number }>;
    campaignId?: string;
  }): Promise<{ ratings: ProjectRating[] } | { error: string }> {
    // Validate all ratings
    for (const r of input.ratings) {
      if (r.rating < 1 || r.rating > 5) {
        return { error: `Invalid rating ${r.rating} for project ${r.projectId}` };
      }
    }

    try {
      // Use transaction for bulk update
      const ratings = await prisma.$transaction(
        input.ratings.map(r => 
          prisma.projectRating.upsert({
            where: {
              userId_projectId_campaignId: {
                userId: input.userId,
                projectId: r.projectId,
                campaignId: input.campaignId || null
              }
            },
            update: {
              rating: r.rating,
            },
            create: {
              userId: input.userId,
              projectId: r.projectId,
              rating: r.rating,
              campaignId: input.campaignId || null,
            }
          })
        )
      );

      return { ratings };
    } catch (error) {
      console.error('Error updating ratings:', error);
      return { error: `Failed to update ratings: ${error}` };
    }
  }

  async _getUserRatings(input: {
    userId: string;
    campaignId?: string;
  }): Promise<ProjectRating[]> {
    return await prisma.projectRating.findMany({
      where: {
        userId: input.userId,
        ...(input.campaignId && { campaignId: input.campaignId })
      },
      orderBy: {
        rating: 'asc' // Most preferred first
      }
    });
  }

  async _getProjectRatings(input: {
    projectId: string;
    campaignId?: string;
  }): Promise<ProjectRating[]> {
    return await prisma.projectRating.findMany({
      where: {
        projectId: input.projectId,
        ...(input.campaignId && { campaignId: input.campaignId })
      }
    });
  }

  async _getProjectAnalytics(input: {
    campaignId?: string;
    limit?: number;
  }): Promise<RatingAnalytics[]> {
    const projects = await prisma.project.findMany({
      include: {
        ratings: {
          where: input.campaignId ? { campaignId: input.campaignId } : {}
        }
      },
      take: input.limit || 100
    });

    return projects
      .map(project => {
        const ratings = project.ratings;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        ratings.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const avg = ratings.length > 0 ? sum / ratings.length : 0;
        const topRatedBy = ratings.filter(r => r.rating === 5).length; // 5 = Most Preferred

        return {
          projectId: project.id,
          projectTitle: project.title,
          averageRating: avg,
          totalRatings: ratings.length,
          ratingDistribution: distribution,
          topRatedBy
        };
      })
      .filter(analytics => analytics.totalRatings > 0) // Only include projects with ratings
      .sort((a, b) => {
        // Sort by most top ratings first, then by highest average
        if (b.topRatedBy !== a.topRatedBy) return b.topRatedBy - a.topRatedBy;
        return b.averageRating - a.averageRating; // Higher average is better
      });
  }

  async _getTopPreferredProjects(input: {
    campaignId?: string;
    topN?: number;
  }): Promise<RatingAnalytics[]> {
    const analytics = await this._getProjectAnalytics({
      campaignId: input.campaignId
    });
    
    return analytics.slice(0, input.topN || 10);
  }
}
