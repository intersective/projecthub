import { prisma } from "@/lib/prisma";

export interface IndustryPreference {
  id: string;
  userId: string;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
}

export class IndustryPreferenceConcept {
  /**
   * Set user's industry preferences (replaces all existing)
   */
  async setPreferences(input: {
    userId: string;
    industries?: string[];
  }): Promise<{ preferences: IndustryPreference[] } | { error: string }> {
    try {
      // Validate input
      if (!input.userId) {
        return { error: "User ID is required" };
      }

      // Remove duplicates and empty strings
      const industries = Array.isArray(input.industries) ? input.industries : [];
      const uniqueIndustries = [
        ...new Set(
          industries
            .filter((industry): industry is string => typeof industry === "string")
            .map(industry => industry.trim())
            .filter(industry => industry.length > 0)
        )
      ];

      // Transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Delete existing preferences
        await tx.industryPreference.deleteMany({
          where: { userId: input.userId }
        });

        // Create new preferences if any
        if (uniqueIndustries.length > 0) {
          await tx.industryPreference.createMany({
            data: uniqueIndustries.map(industry => ({
              userId: input.userId,
              industry: industry.trim()
            }))
          });
        }

        // Fetch and return created preferences
        return await tx.industryPreference.findMany({
          where: { userId: input.userId },
          orderBy: { industry: 'asc' }
        });
      });

      return { preferences: result };
    } catch (error: any) {
      console.error('[IndustryPreference] Failed to set preferences:', error);
      return { error: 'Failed to set industry preferences' };
    }
  }

  /**
   * Add a single preference
   */
  async addPreference(input: {
    userId: string;
    industry: string;
  }): Promise<{ preference: IndustryPreference } | { error: string }> {
    try {
      if (!input.userId || !input.industry?.trim()) {
        return { error: "User ID and industry are required" };
      }

      // Check if preference already exists
      const existing = await prisma.industryPreference.findUnique({
        where: {
          userId_industry: {
            userId: input.userId,
            industry: input.industry.trim()
          }
        }
      });

      if (existing) {
        return { preference: existing };
      }

      // Create new preference
      const preference = await prisma.industryPreference.create({
        data: {
          userId: input.userId,
          industry: input.industry.trim()
        }
      });

      return { preference };
    } catch (error: any) {
      console.error('[IndustryPreference] Failed to add preference:', error);
      return { error: 'Failed to add industry preference' };
    }
  }

  /**
   * Remove a single preference
   */
  async removePreference(input: {
    userId: string;
    industry: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      if (!input.userId || !input.industry?.trim()) {
        return { error: "User ID and industry are required" };
      }

      await prisma.industryPreference.delete({
        where: {
          userId_industry: {
            userId: input.userId,
            industry: input.industry.trim()
          }
        }
      });

      return { success: true };
    } catch (error: any) {
      // Not found is not an error in this case
      if (error.code === 'P2025') {
        return { success: true };
      }
      console.error('[IndustryPreference] Failed to remove preference:', error);
      return { error: 'Failed to remove industry preference' };
    }
  }

  /**
   * Clear all preferences for a user
   */
  async clearPreferences(input: {
    userId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      if (!input.userId) {
        return { error: "User ID is required" };
      }

      await prisma.industryPreference.deleteMany({
        where: { userId: input.userId }
      });

      return { success: true };
    } catch (error: any) {
      console.error('[IndustryPreference] Failed to clear preferences:', error);
      return { error: 'Failed to clear industry preferences' };
    }
  }

  /**
   * Get preferences for a specific user
   */
  async _getByUserId(input: { userId: string }): Promise<IndustryPreference[]> {
    return await prisma.industryPreference.findMany({
      where: { userId: input.userId },
      orderBy: { industry: 'asc' }
    });
  }

  /**
   * Get all users interested in an industry
   */
  async _getUsersByIndustry(input: { industry: string }): Promise<IndustryPreference[]> {
    return await prisma.industryPreference.findMany({
      where: { industry: input.industry },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get available industries from projects
   */
  async _getAvailableIndustries(input: {}): Promise<string[]> {
    const industries = await prisma.project.findMany({
      select: { industry: true },
      distinct: ['industry'],
      where: {
        status: 'active'
      },
      orderBy: { industry: 'asc' }
    });

    return industries
      .map(p => p.industry)
      .filter((industry): industry is string => Boolean(industry));
  }
}
