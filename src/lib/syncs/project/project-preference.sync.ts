import { APIConcept } from '@/lib/concepts/common/api';
import { ProjectPreferenceConcept } from '@/lib/concepts/project/project-preference';
import { actions, Frames, Vars } from '@/lib/engine';

export function makeProjectPreferenceSyncs(
  API: APIConcept,
  ProjectPreference: ProjectPreferenceConcept
) {
  /**
   * Set user preferences (max 5, ranked 1-5)
   */
  const SetPreferences = ({ request, userId, preferences }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'POST', path: '/api/project-preferences' },
      { request }
    ]),
    then: actions([
      ProjectPreference.setPreferences,
      {
        userId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return '';
        },
        preferences: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).body?.preferences || [];
          }
          return [];
        }
      }
    ])
  });

  /**
   * Get user preferences
   */
  const GetPreferences = ({ request, userId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'GET', path: '/api/project-preferences' },
      { request }
    ]),
    then: actions([
      ProjectPreference.getUserPreferences,
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
   * Remove a specific preference
   */
  const RemovePreference = ({ request, userId, projectId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'DELETE', path: '/api/project-preferences/:projectId' },
      { request }
    ]),
    then: actions([
      ProjectPreference.removePreference,
      {
        userId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return '';
        },
        projectId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).params?.projectId || '';
          }
          return '';
        }
      }
    ])
  });

  /**
   * Clear all preferences for a user
   */
  const ClearPreferences = ({ request, userId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'DELETE', path: '/api/project-preferences' },
      { request }
    ]),
    then: actions([
      ProjectPreference.clearUserPreferences,
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
   * Get project preference stats
   */
  const GetProjectStats = ({ request, projectId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'GET', path: '/api/project-preferences/stats/:projectId' },
      { request }
    ]),
    then: actions([
      ProjectPreference.getProjectPreferenceStats,
      {
        projectId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).params?.projectId || '';
          }
          return '';
        }
      }
    ])
  });

  return {
    SetPreferences,
    GetPreferences,
    RemovePreference,
    ClearPreferences,
    GetProjectStats
  };
}
