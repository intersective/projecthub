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

  // NOTE: Query actions (_getByUser, _isSaved) cannot be used in syncs
  // because they are bound but not instrumented. They should be called
  // directly from the API routes instead.
  // See: src/lib/engine/sync.ts instrumentConcept() method

  return {
    SaveProjectBookmark,
    UnsaveProjectBookmark
  };
}
