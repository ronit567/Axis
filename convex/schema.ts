import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Axis marketplace schema.
 *
 * The schema lives in source control, and because every enum (e.g.
 * `listings.status`) is defined here once, the create path and the read path
 * can no longer disagree — that mismatch was the original "empty feed" bug.
 *
 * Auth is Convex Auth (password provider, see `auth.ts`). `...authTables`
 * brings in authAccounts/authSessions/etc.; `users` below overrides the
 * default auth users table, keeping its managed fields and adding the Axis
 * profile fields. The profile row is created at sign-up by the Password
 * provider's `profile()` callback — account and profile in one flow.
 */
export default defineSchema({
  ...authTables,

  users: defineTable({
    // Fields managed by Convex Auth — keep shapes/indexes it expects.
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Axis profile fields. firstName/lastName are set by auth.ts#profile()
    // at sign-up; the rest via users.updateProfile (ProfileSetup screen).
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    program: v.optional(v.string()),
    yearOfStudy: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

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
