import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Resolve the current user's `users._id`, or null if not signed in.
 *
 * TEMPORARY IMPLEMENTATION. This uses the built-in `ctx.auth.getUserIdentity()`
 * so the scaffold works with any auth provider before one is fully wired. When
 * you run the `convex-setup-auth` skill (Task 1, docs/06-kickoff-plan.md):
 *   - If you adopt Convex Auth, replace the body with `getAuthUserId(ctx)` from
 *     "@convex-dev/auth/server" and drop `users.tokenIdentifier` / `by_token`.
 *   - Whichever provider you choose, this is the ONE place callers depend on,
 *     so the swap is localized.
 */
export async function getUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  return user?._id ?? null;
}

/** Same as getUserId, but throws when unauthenticated. Use in mutations. */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
