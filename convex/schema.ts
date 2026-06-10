import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Axis marketplace schema.
 *
 * This single file replaces all of `supabase/schema.sql` AND the `profiles`
 * table that was never checked into source control. Because every enum (e.g.
 * `listings.status`) is defined here once, the create path and the read path
 * can no longer disagree — that mismatch was the original "empty feed" bug.
 *
 * AUTH NOTE: this scaffold is auth-provider-agnostic. `users.tokenIdentifier`
 * + the `by_token` index let `convex/lib/auth.ts#requireUserId` resolve the
 * caller with the built-in `ctx.auth.getUserIdentity()`. When you run the
 * `convex-setup-auth` skill (Task 1 in docs/06-kickoff-plan.md), reconcile this
 * with the provider's tables — e.g. spread `...authTables` and swap the helper
 * for `getAuthUserId`. See the kickoff plan for the exact step.
 */
export default defineSchema({
  users: defineTable({
    // Stable identity string from ctx.auth.getUserIdentity(). Temporary bridge
    // until Convex Auth is wired — see schema note above.
    tokenIdentifier: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    program: v.optional(v.string()),
    yearOfStudy: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  listings: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.union(
      v.literal("Books"),
      v.literal("Electronics"),
      v.literal("Furniture"),
      v.literal("Clothing"),
      v.literal("Appliances"),
      v.literal("Other"),
    ),
    condition: v.union(
      v.literal("Like New"),
      v.literal("Good"),
      v.literal("Fair"),
    ),
    // Convex file storage IDs, NOT public URLs. Resolve to URLs in queries.
    images: v.array(v.id("_storage")),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("removed"),
    ),
    meetupLocation: v.optional(v.string()),
    meetupAvailability: v.optional(v.string()),
    views: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_seller", ["sellerId"])
    .index("by_status_and_category", ["status", "category"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "category"],
    }),

  conversations: defineTable({
    listingId: v.id("listings"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    lastMessageText: v.optional(v.string()),
    lastMessageAt: v.number(),
    buyerUnread: v.number(),
    sellerUnread: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_listing_buyer_seller", ["listingId", "buyerId", "sellerId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("offer"),
      v.literal("image"),
      v.literal("system"),
    ),
    offerAmount: v.optional(v.number()),
    readAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId"]),
});
