import { apiRequest } from "../lib/apiClient";

export function linkGuardian(token, guardianEmail) {
  return apiRequest("/link-guardian", {
    method: "POST",
    token,
    body: {
      guardian_email: guardianEmail,
    },
  });
}

export function getMyGuardians(token) {
  return apiRequest("/my-guardians", { token });
}

export function getMyDrivers(token) {
  return apiRequest("/my-drivers", { token });
}
