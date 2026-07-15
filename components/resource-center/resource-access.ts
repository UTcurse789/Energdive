import type { EventResource } from "./types";

export type AccessDecision = "allow" | "require_auth" | "require_purchase";

export const RESOURCE_AUTH_LOCK_MESSAGE =
  "Please login to access this content";
export const RESOURCE_PREMIUM_LOCK_MESSAGE =
  "Please login and pay to access this content";

export function getResourceDownloadLockMessage(
  resource: Pick<EventResource, "content_access">
) {
  const accessType = resource.content_access?.access_type || "authenticated";

  if (accessType === "public") return null;
  if (accessType === "premium") return RESOURCE_PREMIUM_LOCK_MESSAGE;

  return RESOURCE_AUTH_LOCK_MESSAGE;
}

/**
 * Determines whether the current user has purchased a resource.
 * FUTURE: Replace this with an API call → hasPurchased(userId, resourceId)
 */
export function hasPurchased(_userId: string, _resourceId: string): boolean {
  return false;
}

/**
 * Given a resource and auth state, returns the access decision.
 * Returns: "allow" | "require_auth" | "require_purchase"
 */
export function getResourceAccessDecision(
  resource: EventResource,
  isSignedIn: boolean,
  userId?: string
): AccessDecision {
  const accessType = resource.content_access?.access_type || "authenticated";

  if (accessType === "public") {
    return "allow";
  }

  if (accessType === "authenticated") {
    return isSignedIn ? "allow" : "require_auth";
  }

  if (accessType === "premium") {
    if (!isSignedIn || !userId) {
      return "require_auth";
    }
    
    if (hasPurchased(userId, resource.id)) {
      return "allow";
    }

    return "require_purchase";
  }

  // Fallback
  return isSignedIn ? "allow" : "require_auth";
}
