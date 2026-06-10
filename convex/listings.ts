import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const categoryValidator = v.union(
  v.literal("Books"),
  v.literal("Electronics"),
  v.literal("Furniture"),
  v.literal("Clothing"),
  v.literal("Appliances"),
  v.literal("Other"),
);

const conditionValidator = v.union(
  v.literal("Like New"),
  v.literal("Good"),
  v.literal("Fair"),
);

/** Attach resolved image URLs + seller summary so a card has all it needs. */
async function hydrate(ctx: QueryCtx, listing: Doc<"listings">) {
  const seller = await ctx.db.get(listing.sellerId);
  return {
    ...listing,
    imageUrls: await Promise.all(
      listing.images.map((id) => ctx.storage.getUrl(id)),
    ),
    seller: seller
      ? { _id: seller._id, firstName: seller.firstName, lastName: seller.lastName }
      : null,
  };
}

/**
 * Main feed. Reactive: replaces getListings + the realtime subscription and the
 * manual list-patching in the old MainHomeScreen. Active listings, newest first,
 * with optional category and full-text search.
 */
export const feed = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, search, limit }) => {
    const take = limit ?? 50;
    let rows: Doc<"listings">[];

    if (search && search.trim()) {
      rows = await ctx.db
        .query("listings")
        .withSearchIndex("search_title", (q) => {
          const base = q.search("title", search).eq("status", "active");
          return category && category !== "All"
            ? base.eq("category", category as Doc<"listings">["category"])
            : base;
        })
        .take(take);
    } else if (category && category !== "All") {
      rows = await ctx.db
        .query("listings")
        .withIndex("by_status_and_category", (q) =>
          q.eq("status", "active").eq("category", category as Doc<"listings">["category"]),
        )
        .order("desc")
        .take(take);
    } else {
      rows = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .order("desc")
        .take(take);
    }

    return Promise.all(rows.map((l) => hydrate(ctx, l)));
  },
});

/** Most-viewed active listings. Replaces getTrendingListings. */
export const trending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const top = rows.sort((a, b) => b.views - a.views).slice(0, limit ?? 10);
    return Promise.all(top.map((l) => hydrate(ctx, l)));
  },
});

export const getById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) return null;
    return hydrate(ctx, listing);
  },
});

/** The current user's own listings (any non-removed status). */
export const myListings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .collect();
    return rows.filter((l) => l.status !== "removed");
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: categoryValidator,
    condition: conditionValidator,
    images: v.array(v.id("_storage")),
    meetupLocation: v.optional(v.string()),
    meetupAvailability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sellerId = await requireUserId(ctx);
    if (args.price < 0) throw new Error("Price must be >= 0");
    return ctx.db.insert("listings", {
      ...args,
      sellerId,
      status: "active", // create + read agree by construction
      views: 0,
    });
  },
});

async function assertOwner(ctx: QueryCtx, id: Id<"listings">) {
  const userId = await requireUserId(ctx);
  const listing = await ctx.db.get(id);
  if (!listing) throw new Error("Listing not found");
  if (listing.sellerId !== userId) throw new Error("Not allowed");
  return listing;
}

export const update = mutation({
  args: {
    id: v.id("listings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(categoryValidator),
    condition: v.optional(conditionValidator),
    images: v.optional(v.array(v.id("_storage"))),
    meetupLocation: v.optional(v.string()),
    meetupAvailability: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await assertOwner(ctx, id);
    const patch = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(id, patch);
  },
});

export const markSold = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    await assertOwner(ctx, id);
    await ctx.db.patch(id, { status: "sold" });
  },
});

export const remove = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    await assertOwner(ctx, id);
    await ctx.db.patch(id, { status: "removed" });
  },
});

export const incrementViews = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) return;
    await ctx.db.patch(id, { views: listing.views + 1 });
  },
});
