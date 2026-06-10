import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Resolve the current user's `users._id`, or null if not signed in.
 * Backed by Convex Auth (see ../auth.ts) — this is the one place callers
 * depend on, so the provider stays swappable.
 */
export async function getUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

/** Same as getUserId, but throws when unauthenticated. Use in mutations. */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
