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

export function getGuardianNotifications(token, params = {}) {
  return apiRequest("/logs/guardian-notifications", {
    token,
    query: params,
  });
}

export function markGuardianNotificationRead(token, notificationId) {
  return apiRequest(`/logs/guardian-notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
}
