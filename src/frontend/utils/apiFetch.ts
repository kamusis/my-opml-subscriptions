// Wrapper around fetch to always include the x-user-id header for multi-user support
import { getUserId } from "../../utils/user.ts";

export function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const userId = getUserId();
  const headers = new Headers(init.headers || {});
  if (userId) {
    headers.set("x-user-id", userId);
  }
  return fetch(input, { ...init, headers });
}
