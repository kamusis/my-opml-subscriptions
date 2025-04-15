// utils/user.ts

// Utility to manage and retrieve the persistent userId for multi-user support
// Creates a new UUID and stores in localStorage if not already present

export function getUserId(): string {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
  }
  return userId;
}

/**
 * Extracts userId from request headers and returns a tuple:
 * [userId, errorResponse]
 * - If userId is present, errorResponse is null.
 * - If userId is missing, userId is null and errorResponse is a Response object.
 */
export function extractUserIdFromRequest(req: Request): [string | null, Response | null] {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return [null, new Response(JSON.stringify({
      error: "Missing userId",
      message: "A userId must be provided in the 'x-user-id' header."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })];
  }
  return [userId, null];
}
