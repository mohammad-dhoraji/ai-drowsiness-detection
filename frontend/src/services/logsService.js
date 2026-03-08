import { apiRequest } from "../lib/apiClient";

export function getEvents(token, params = {}) {
  return apiRequest("/logs/events", {
    token,
    query: params,
  });
}

export function getSummary(token, params = {}) {
  return apiRequest("/logs/summary", {
    token,
    query: params,
  });
}
