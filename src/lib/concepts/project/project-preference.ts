import { prisma } from '@/lib/prisma';

export interface ProjectPreference {
  id: string;
  userId: string;
  projectId: string;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectPreferenceConcept {
  /**
   * Set or update all preferences for a user (max 5)
   * Replaces existing preferences with new ones
   */
  async setPreferences(input: {
    userId: string;
    preferences: Array<{ projectId: string; rank: number }>;
  }): Promise<{ preferences: ProjectPreference[] } | { error: string }> {
    try {
      const { userId, preferences } = input;

      // Validate input
      if (!userId) {
        return { error: 'User ID is required' };
      }

      if (!preferences || preferences.length === 0) {
        return { error: 'At least one preference is required' };
      }

      if (preferences.length > 5) {
        return { error: 'Maximum 5 preferences allowed' };
      }

      // Validate ranks are 1-5 and unique
      const ranks = preferences.map(p => p.rank);
      if (ranks.some(r => r < 1 || r > 5)) {
        return { error: 'Ranks must be between 1 and 5' };
      }

      if (new Set(ranks).size !== ranks.length) {
        return { error: 'Each rank must be unique' };
      }

      // Validate project IDs are unique
      const projectIds = preferences.map(p => p.projectId);
      if (new Set(projectIds).size !== projectIds.length) {
        return { error: 'Each project can only be selected once' };
      }

      // Verify all projects exist
      const projects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          status: 'active'
        }
      });

      if (projects.length !== projectIds.length) {
        return { error: 'One or more projects not found or not active' };
      }

      // Delete existing preferences for this user
      await prisma.projectPreference.deleteMany({
        where: { userId }
      });

      // Create new preferences
      const created = await prisma.projectPreference.createMany({
        data: preferences.map(p => ({
          userId,
          projectId: p.projectId,
          rank: p.rank
        }))
      });

      // Fetch and return the created preferences
      const result = await prisma.projectPreference.findMany({
        where: { userId },
        orderBy: { rank: 'asc' }
      });

      return { preferences: result };
    } catch (error) {
      console.error('Error setting preferences:', error);
      return { error: 'Failed to set preferences' };
    }
  }

  /**
   * Remove a specific preference
   */
  async removePreference(input: {
    userId: string;
    projectId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const { userId, projectId } = input;

      if (!userId || !projectId) {
        return { error: 'User ID and Project ID are required' };
      }

      // Find the preference to remove
      const preference = await prisma.projectPreference.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      if (!preference) {
        return { error: 'Preference not found' };
      }

      const removedRank = preference.rank;

      // Delete the preference
      await prisma.projectPreference.delete({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      // Reorder remaining preferences
      await prisma.projectPreference.updateMany({
        where: {
          userId,
          rank: { gt: removedRank }
        },
        data: {
          rank: { decrement: 1 }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing preference:', error);
      return { error: 'Failed to remove preference' };
    }
  }

  /**
   * Get all preferences for a user, ordered by rank
   */
  async getUserPreferences(input: {
    userId: string;
  }): Promise<{ preferences: ProjectPreference[] } | { error: string }> {
    try {
      const { userId } = input;

      if (!userId) {
        return { error: 'User ID is required' };
      }

      const preferences = await prisma.projectPreference.findMany({
        where: { userId },
        orderBy: { rank: 'asc' }
      });

      return { preferences };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return { error: 'Failed to get preferences' };
    }
  }

  /**
   * Remove all preferences for a user
   */
  async clearUserPreferences(input: {
    userId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const { userId } = input;

      if (!userId) {
        return { error: 'User ID is required' };
      }

      await prisma.projectPreference.deleteMany({
        where: { userId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing preferences:', error);
      return { error: 'Failed to clear preferences' };
    }
  }

  /**
   * Get statistics about how many users prefer this project
   */
  async getProjectPreferenceStats(input: {
    projectId: string;
  }): Promise<
    | { stats: { totalUsers: number; byRank: Record<number, number> } }
    | { error: string }
  > {
    try {
      const { projectId } = input;

      if (!projectId) {
        return { error: 'Project ID is required' };
      }

      const preferences = await prisma.projectPreference.findMany({
        where: { projectId }
      });

      const byRank: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

      preferences.forEach(p => {
        byRank[p.rank] = (byRank[p.rank] || 0) + 1;
      });

      return {
        stats: {
          totalUsers: preferences.length,
          byRank
        }
      };
    } catch (error) {
      console.error('Error getting project stats:', error);
      return { error: 'Failed to get project stats' };
    }
  }

  /**
   * Query: Get all preferences for a user
   */
  async _getByUser(input: { userId: string }): Promise<ProjectPreference[]> {
    return await prisma.projectPreference.findMany({
      where: { userId: input.userId },
      orderBy: { rank: 'asc' }
    });
  }

  /**
   * Query: Get all users who prefer this project
   */
  async _getByProject(input: {
    projectId: string;
  }): Promise<ProjectPreference[]> {
    return await prisma.projectPreference.findMany({
      where: { projectId: input.projectId },
      orderBy: { rank: 'asc' }
    });
  }

  /**
   * Query: Get the project at a specific rank for a user
   */
  async _getByRank(input: {
    userId: string;
    rank: number;
  }): Promise<ProjectPreference | null> {
    return await prisma.projectPreference.findUnique({
      where: {
        userId_rank: {
          userId: input.userId,
          rank: input.rank
        }
      }
    });
  }

  /**
   * Get analytics data for admin dashboard
   */
  async getAnalytics(input: {}): Promise<
    | {
        analytics: {
          totalLearnersWithPreferences: number;
          totalProjectsSelected: number;
          averageProjectsPerLearner: number;
          mostPreferredProjects: Array<{
            projectId: string;
            totalSelections: number;
            rank1Count: number;
            rank2Count: number;
            rank3Count: number;
            rank4Count: number;
            rank5Count: number;
            averageRank: number;
          }>;
          unselectedProjectIds: string[];
          preferenceDistribution: {
            rank: number;
            count: number;
          }[];
        };
      }
    | { error: string }
  > {
    try {
      // Get all preferences
      const allPreferences = await prisma.projectPreference.findMany();

      // Get all active projects
      const allProjects = await prisma.project.findMany({
        where: { status: 'active' },
        select: { id: true }
      });

      // Calculate total learners with preferences
      const uniqueUsers = new Set(allPreferences.map(p => p.userId));
      const totalLearnersWithPreferences = uniqueUsers.size;

      // Calculate total unique projects selected
      const uniqueProjects = new Set(allPreferences.map(p => p.projectId));
      const totalProjectsSelected = uniqueProjects.size;

      // Calculate average projects per learner
      const averageProjectsPerLearner =
        totalLearnersWithPreferences > 0
          ? allPreferences.length / totalLearnersWithPreferences
          : 0;

      // Group preferences by project
      const projectStats = new Map<
        string,
        {
          totalSelections: number;
          rank1Count: number;
          rank2Count: number;
          rank3Count: number;
          rank4Count: number;
          rank5Count: number;
          totalRank: number;
        }
      >();

      allPreferences.forEach(pref => {
        const stats = projectStats.get(pref.projectId) || {
          totalSelections: 0,
          rank1Count: 0,
          rank2Count: 0,
          rank3Count: 0,
          rank4Count: 0,
          rank5Count: 0,
          totalRank: 0
        };

        stats.totalSelections++;
        stats.totalRank += pref.rank;

        if (pref.rank === 1) stats.rank1Count++;
        if (pref.rank === 2) stats.rank2Count++;
        if (pref.rank === 3) stats.rank3Count++;
        if (pref.rank === 4) stats.rank4Count++;
        if (pref.rank === 5) stats.rank5Count++;

        projectStats.set(pref.projectId, stats);
      });

      // Calculate most preferred projects
      const mostPreferredProjects = Array.from(projectStats.entries())
        .map(([projectId, stats]) => ({
          projectId,
          totalSelections: stats.totalSelections,
          rank1Count: stats.rank1Count,
          rank2Count: stats.rank2Count,
          rank3Count: stats.rank3Count,
          rank4Count: stats.rank4Count,
          rank5Count: stats.rank5Count,
          averageRank: stats.totalRank / stats.totalSelections
        }))
        .sort((a, b) => {
          // Sort by total selections descending, then by average rank ascending
          if (b.totalSelections !== a.totalSelections) {
            return b.totalSelections - a.totalSelections;
          }
          return a.averageRank - b.averageRank;
        });

      // Find unselected projects
      const selectedProjectIds = new Set(projectStats.keys());
      const unselectedProjectIds = allProjects
        .filter(p => !selectedProjectIds.has(p.id))
        .map(p => p.id);

      // Calculate preference distribution by rank
      const preferenceDistribution = [1, 2, 3, 4, 5].map(rank => ({
        rank,
        count: allPreferences.filter(p => p.rank === rank).length
      }));

      return {
        analytics: {
          totalLearnersWithPreferences,
          totalProjectsSelected,
          averageProjectsPerLearner: Math.round(averageProjectsPerLearner * 10) / 10,
          mostPreferredProjects,
          unselectedProjectIds,
          preferenceDistribution
        }
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return { error: 'Failed to get analytics' };
    }
  }
}
