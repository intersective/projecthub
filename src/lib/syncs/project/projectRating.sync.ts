import { APIConcept } from "@/lib/concepts/common/api";
import { ProjectRatingConcept } from "@/lib/concepts/project/projectRating";
import { actions, Vars } from "@/lib/engine";

export function makeProjectRatingSyncs(
  API: APIConcept,
  ProjectRating: ProjectRatingConcept
) {
  // Set a project rating
  const SetProjectRating = ({ request, userId, projectId, rating, campaignId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "POST", path: "/api/projects/rating" },
      { request, userId, projectId, rating, campaignId }
    ]),
    then: actions([
      ProjectRating.setRating,
      { userId, projectId, rating, campaignId }
    ]),
  });

  // Remove a project rating
  const RemoveProjectRating = ({ request, userId, projectId, campaignId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "DELETE", path: "/api/projects/rating" },
      { request, userId, projectId, campaignId }
    ]),
    then: actions([
      ProjectRating.removeRating,
      { userId, projectId, campaignId }
    ]),
  });

  // Get user's ratings
  const GetUserRatings = ({ request, userId, campaignId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "GET", path: "/api/projects/my-ratings" },
      { request, userId, campaignId }
    ]),
    then: actions([
      ProjectRating._getUserRatings,
      { userId, campaignId }
    ]),
  });

  // Get project analytics for admin
  const GetProjectAnalytics = ({ request, campaignId, limit }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "GET", path: "/api/projects/rating-analytics" },
      { request, campaignId, limit }
    ]),
    then: actions([
      ProjectRating._getProjectAnalytics,
      { campaignId, limit }
    ]),
  });

  // Bulk update user ratings
  const UpdateUserRatings = ({ request, userId, ratings, campaignId }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "PUT", path: "/api/projects/ratings/bulk" },
      { request, userId, ratings, campaignId }
    ]),
    then: actions([
      ProjectRating.updateUserRatings,
      { userId, ratings, campaignId }
    ]),
  });

  return {
    SetProjectRating,
    RemoveProjectRating,
    GetUserRatings,
    GetProjectAnalytics,
    UpdateUserRatings
  };
}
