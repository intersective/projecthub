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

  /**
   * Get share link by code
   */
  const GetShareLinkByCode = ({ request, code }: Vars) => ({
    when: actions([
      API.request as any,
      { method: 'GET', path: '/api/share-links/by-code' },
      { request }
    ]),
    then: actions([
      ShareLink._getByCode,
      {
        code: (frames: Frames) => {
          for (const frame of frames) {
            const url = (frame as any).url;
            if (!url) return '';
            const params = new URLSearchParams(url.split('?')[1]);
            return params.get('code') || '';
          }
          return '';
        }
      }
    ])
  });

  return {
    CreateShareLink,
    TrackShareClick,
    GetShareLinkByCode
  };
}
