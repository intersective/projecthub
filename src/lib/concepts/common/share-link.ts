import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export interface ShareLink {
  id: string;
  projectId: string;
  userId: string;
  code: string;
  clickCount: number;
  lastClickedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShareLinkConcept {
  
  /**
   * Generate a unique short code for sharing
   */
  private generateCode(): string {
    // Generate 8-character alphanumeric code
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create or get existing share link for user-project combination
   */
  async createOrGet(input: {
    userId: string;
    projectId: string;
  }): Promise<{ shareLink: ShareLink } | { error: string }> {
    try {
      const { userId, projectId } = input;

      if (!userId || !projectId) {
        return { error: 'User ID and Project ID are required' };
      }

      // Check if share link already exists for this user-project combo
      const existing = await prisma.shareLink.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      if (existing) {
        return { shareLink: existing };
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return { error: 'Project not found' };
      }

      // Generate unique code
      let code = this.generateCode();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure code is unique
      while (attempts < maxAttempts) {
        const codeExists = await prisma.shareLink.findUnique({
          where: { code }
        });

        if (!codeExists) break;
        
        code = this.generateCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return { error: 'Failed to generate unique code' };
      }

      // Create share link
      const shareLink = await prisma.shareLink.create({
        data: {
          userId,
          projectId,
          code,
          clickCount: 0
        }
      });

      return { shareLink };
    } catch (error) {
      console.error('Error creating share link:', error);
      return { error: 'Failed to create share link' };
    }
  }

  /**
   * Track a click on a share link
   */
  async trackClick(input: {
    code: string;
    referrerId?: string;
  }): Promise<{ shareLink: ShareLink } | { error: string }> {
    try {
      const { code } = input;

      if (!code) {
        return { error: 'Share code is required' };
      }

      const shareLink = await prisma.shareLink.update({
        where: { code },
        data: {
          clickCount: { increment: 1 },
          lastClickedAt: new Date()
        }
      });

      return { shareLink };
    } catch (error) {
      console.error('Error tracking click:', error);
      return { error: 'Failed to track click' };
    }
  }

  /**
   * Increment click count
   */
  async incrementClicks(input: {
    code: string;
  }): Promise<{ shareLink: ShareLink } | { error: string }> {
    return this.trackClick(input);
  }

  /**
   * Get share link by code
   */
  async _getByCode(input: { code: string }): Promise<ShareLink | null> {
    return await prisma.shareLink.findUnique({
      where: { code: input.code }
    });
  }

  /**
   * Get all share links created by user
   */
  async _getByUser(input: { userId: string }): Promise<ShareLink[]> {
    return await prisma.shareLink.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all share links for a project
   */
  async _getByProject(input: { projectId: string }): Promise<ShareLink[]> {
    return await prisma.shareLink.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get share link for specific user-project combination
   */
  async _getByUserAndProject(input: {
    userId: string;
    projectId: string;
  }): Promise<ShareLink | null> {
    return await prisma.shareLink.findUnique({
      where: {
        userId_projectId: {
          userId: input.userId,
          projectId: input.projectId
        }
      }
    });
  }

  /**
   * Get statistics for user's share links
   */
  async _getStats(input: { userId: string }): Promise<{
    totalLinks: number;
    totalClicks: number;
  }> {
    const links = await prisma.shareLink.findMany({
      where: { userId: input.userId },
      select: { clickCount: true }
    });

    return {
      totalLinks: links.length,
      totalClicks: links.reduce((sum, link) => sum + link.clickCount, 0)
    };
  }
}
