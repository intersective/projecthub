import { APIConcept } from '@/lib/concepts/common/api';
import { ShareLinkConcept } from '@/lib/concepts/common/share-link';
import { actions, Frames, Vars } from '@/lib/engine';

export function makeShareLinkSyncs(
  API: APIConcept,
  ShareLink: ShareLinkConcept
) {
  /**
   * Create or get share link
   */
  const CreateShareLink = ({ request, userId, projectId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'POST', path: '/api/share-links' },
      { request }
    ]),
    then: actions([
      ShareLink.createOrGet,
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
   * Track share link click
   */
  const TrackShareClick = ({ request, code }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'POST', path: '/api/share-links/track' },
      { request }
    ]),
    then: actions([
      ShareLink.trackClick,
      {
        code: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).body?.code;
          }
          return '';
        },
        referrerId: (frames: Frames) => {
          for (const frame of frames) {
            return (frame as any).headers?.['x-user-id'];
          }
          return undefined;
        }
      }
    ])
  });

  // NOTE: Query actions (_getByCode, _getByUser, etc.) cannot be used in syncs
  // because they are bound but not instrumented. They should be called
  // directly from the API routes instead.
  // See: src/lib/engine/sync.ts instrumentConcept() method

  return {
    CreateShareLink,
    TrackShareClick
  };
}
