import * as profileService from "@/services/profileService";

export function getProfileData() {
  return profileService.getProfile();
}
