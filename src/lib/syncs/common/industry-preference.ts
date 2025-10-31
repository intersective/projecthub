import { actions, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { IndustryPreferenceConcept } from "@/lib/concepts/common/industry-preference";
import { ProfileConcept } from "@/lib/concepts/common/profile";

export function makeIndustryPreferenceSyncs(
  API: APIConcept,
  IndustryPreference: IndustryPreferenceConcept,
  Profile: ProfileConcept
) {
  // Update preferences when profile is updated
  const UpdateProfileWithPreferences = ({ request, userId, industries }: Vars) => ({
    when: actions([
      API.request as any,
      { method: "PUT", path: "/api/profile" },
      { request, userId: "request.headers['x-user-id']", industries: "request.body.industryPreferences" }
    ]),
    where: (frames: any) => {
      return frames.some((f: any) => 
        f.request?.body?.industryPreferences !== undefined
      );
    },
    then: actions([
      IndustryPreference.setPreferences,
      { userId, industries }
    ]),
  });

  return {
    UpdateProfileWithPreferences,
  };
}
