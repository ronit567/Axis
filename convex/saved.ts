import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId, requireUserId } from "./lib/auth";
import { hydrate } from "./listings";

/**
 * Saved / wishlisted listings. A save is a single row in `savedListings`
 * keyed by (userId, listingId); the toggle treats that pair as unique.
 */

/**
 * Listing IDs the current user has saved — used to light up the heart on
 * cards and detail screens. Returns [] when signed out so the UI can call it
 * unconditionally without throwing.
 */
export const savedIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("savedListings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => r.listingId);
  },
});

/**
 * The current user's saved listings, hydrated (image URLs + seller), newest
 * save first. Listings that were since removed are skipped so the Saved tab
 * never shows dead entries.
 */
export const listSaved = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("savedListings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const listings = await Promise.all(rows.map((r) => ctx.db.get(r.listingId)));
    const visible = listings.filter(
      (l): l is NonNullable<typeof l> => l != null && l.status !== "removed",
    );
    return Promise.all(visible.map((l) => hydrate(ctx, l)));
  },
});

/**
 * Save or unsave a listing. Returns the new saved state (true = now saved).
 * Idempotent per (user, listing): the by_user_and_listing index makes the
 * existence check a point read, so double-taps can't create duplicate rows.
 */
export const toggleSave = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("savedListings")
      .withIndex("by_user_and_listing", (q) =>
        q.eq("userId", userId).eq("listingId", listingId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("savedListings", { userId, listingId });
    return true;
  },
});
