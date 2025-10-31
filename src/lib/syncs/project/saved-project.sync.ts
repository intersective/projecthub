import { APIConcept } from '@/lib/concepts/common/api';
import { SavedProjectConcept } from '@/lib/concepts/project/saved-project';
import { actions, Frames, Vars } from '@/lib/engine';

export function makeSavedProjectSyncs(
  API: APIConcept,
  SavedProject: SavedProjectConcept
) {
  /**
   * Save a project (bookmark)
   */
  const SaveProjectBookmark = ({ request, userId, projectId, notes }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'POST', path: '/api/saved-projects' },
      { request }
    ]),
    then: actions([
      SavedProject.save,
      {
        userId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return '';
        },
        projectId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).body?.projectId;
          }
          return '';
        },
        notes: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).body?.notes;
          }
          return undefined;
        }
      }
    ])
  });

  /**
   * Unsave a project (remove bookmark)
   */
  const UnsaveProjectBookmark = ({ request, userId, projectId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'DELETE', path: '/api/saved-projects' },
      { request }
    ]),
    then: actions([
      SavedProject.unsave,
      {
        userId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return '';
        },
        projectId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).body?.projectId;
          }
          return '';
        }
      }
    ])
  });

  /**
   * Get saved projects for user
   */
  const GetSavedProjects = ({ request, userId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'GET', path: '/api/saved-projects' },
      { request }
    ]),
    then: actions([
      SavedProject._getByUser,
      {
        userId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return '';
        }
      }
    ])
  });

  /**
   * Check if project is saved
   */
  const CheckSavedStatus = ({ request, userId, projectId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'GET', path: '/api/saved-projects/check' },
      { request }
    ]),
    then: actions([
      SavedProject._isSaved,
      {
        userId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return '';
        },
        projectId: (frames: Frames) => {
          for (const frame of frames) {
            const url = (frame as any).url;
            if (!url) return '';
            const params = new URLSearchParams(url.split('?')[1]);
            return params.get('projectId') || '';
          }
          return '';
        }
      }
    ])
  });

  return {
    SaveProjectBookmark,
    UnsaveProjectBookmark,
    GetSavedProjects,
    CheckSavedStatus
  };
}
