import { apiRequest } from "../lib/apiClient";

export function analyzeFrame(token, payload) {
  return apiRequest("/detection/analyze", {
    method: "POST",
    token,
    body: payload,
  });
}
