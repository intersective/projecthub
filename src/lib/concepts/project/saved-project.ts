import { prisma } from '@/lib/prisma';

export interface SavedProject {
  id: string;
  userId: string;
  projectId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SavedProjectConcept {
  
  /**
   * Save a project to user's bookmarks
   */
  async save(input: {
    userId: string;
    projectId: string;
    notes?: string;
  }): Promise<{ savedProject: SavedProject } | { error: string }> {
    try {
      const { userId, projectId, notes } = input;

      if (!userId || !projectId) {
        return { error: 'User ID and Project ID are required' };
      }

      // Check if already saved
      const existing = await prisma.savedProject.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      if (existing) {
        return { error: 'Project already saved' };
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return { error: 'Project not found' };
      }

      // Create saved project
      const savedProject = await prisma.savedProject.create({
        data: {
          userId,
          projectId,
          notes: notes || null
        }
      });

      return { savedProject };
    } catch (error) {
      console.error('Error saving project:', error);
      // Return more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Failed to save project';
      return { error: errorMessage };
    }
  }

  /**
   * Remove a project from user's bookmarks
   */
  async unsave(input: {
    userId: string;
    projectId: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const { userId, projectId } = input;

      if (!userId || !projectId) {
        return { error: 'User ID and Project ID are required' };
      }

      await prisma.savedProject.delete({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error unsaving project:', error);
      return { error: 'Failed to unsave project' };
    }
  }

  /**
   * Update notes for a saved project
   */
  async updateNotes(input: {
    userId: string;
    projectId: string;
    notes: string;
  }): Promise<{ savedProject: SavedProject } | { error: string }> {
    try {
      const { userId, projectId, notes } = input;

      if (!userId || !projectId) {
        return { error: 'User ID and Project ID are required' };
      }

      const savedProject = await prisma.savedProject.update({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        },
        data: {
          notes
        }
      });

      return { savedProject };
    } catch (error) {
      console.error('Error updating notes:', error);
      return { error: 'Failed to update notes' };
    }
  }

  /**
   * Get all saved projects for a user
   */
  async _getByUser(input: { userId: string }): Promise<SavedProject[]> {
    return await prisma.savedProject.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all users who saved a project
   */
  async _getByProject(input: { projectId: string }): Promise<SavedProject[]> {
    return await prisma.savedProject.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Check if user has saved a project
   */
  async _isSaved(input: { userId: string; projectId: string }): Promise<boolean> {
    const saved = await prisma.savedProject.findUnique({
      where: {
        userId_projectId: {
          userId: input.userId,
          projectId: input.projectId
        }
      }
    });
    return saved !== null;
  }

  /**
   * Get count of saved projects by user
   */
  async _getCountByUser(input: { userId: string }): Promise<number> {
    return await prisma.savedProject.count({
      where: { userId: input.userId }
    });
  }

  /**
   * Get count of users who saved a project
   */
  async _getCountByProject(input: { projectId: string }): Promise<number> {
    return await prisma.savedProject.count({
      where: { projectId: input.projectId }
    });
  }
}
