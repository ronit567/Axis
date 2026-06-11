import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId, requireUserId } from "./lib/auth";

/** The signed-in user's profile, or null. Reactive — re-renders on change. */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      ...user,
      avatarUrl: user.avatarId ? await ctx.storage.getUrl(user.avatarId) : null,
    };
  },
});

/**
 * Pre-signup duplicate check so the SignUp screen can warn before the user
 * fills out the whole profile (same UX as the old checkEmailExists).
 */
export const emailExists = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.trim().toLowerCase()))
      .first();
    return existing !== null;
  },
});

/** Public-facing profile for a seller (no contact fields). */
export const publicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const u = await ctx.db.get(userId);
    if (!u) return null;
    return {
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      program: u.program,
      yearOfStudy: u.yearOfStudy,
      avatarUrl: u.avatarId ? await ctx.storage.getUrl(u.avatarId) : null,
    };
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    program: v.optional(v.string()),
    yearOfStudy: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    // Only patch provided fields.
    const patch = Object.fromEntries(
      Object.entries(args).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(userId, patch);
  },
});
