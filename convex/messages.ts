import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

/** Conversations for the current user, with the other party + listing summary. */
export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const asBuyer = await ctx.db
      .query("conversations")
      .withIndex("by_buyer", (q) => q.eq("buyerId", userId))
      .collect();
    const asSeller = await ctx.db
      .query("conversations")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .collect();

    const all = [...asBuyer, ...asSeller].sort(
      (a, b) => b.lastMessageAt - a.lastMessageAt,
    );

    return Promise.all(
      all.map(async (c) => {
        const isBuyer = c.buyerId === userId;
        const otherUser = await ctx.db.get(isBuyer ? c.sellerId : c.buyerId);
        const listing = await ctx.db.get(c.listingId);
        return {
          ...c,
          isBuyer,
          unread: isBuyer ? c.buyerUnread : c.sellerUnread,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
              }
            : null,
          listing: listing
            ? {
                _id: listing._id,
                title: listing.title,
                price: listing.price,
                imageUrl: listing.images[0]
                  ? await ctx.storage.getUrl(listing.images[0])
                  : null,
              }
            : null,
        };
      }),
    );
  },
});

/**
 * Idempotent: keyed on (listing, buyer, seller) so two rapid taps can't
 * create duplicate threads (no find-then-insert race).
 */
export const getOrCreateConversation = mutation({
  args: { listingId: v.id("listings"), sellerId: v.id("users") },
  handler: async (ctx, { listingId, sellerId }) => {
    const buyerId = await requireUserId(ctx);
    if (buyerId === sellerId) throw new Error("Cannot message yourself");

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_listing_buyer_seller", (q) =>
        q.eq("listingId", listingId).eq("buyerId", buyerId).eq("sellerId", sellerId),
      )
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("conversations", {
      listingId,
      buyerId,
      sellerId,
      lastMessageAt: Date.now(),
      buyerUnread: 0,
      sellerUnread: 0,
    });
  },
});

/** Messages in a conversation, oldest first. Reactive — no subscribe() needed. */
export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await requireUserId(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo) return [];
    if (convo.buyerId !== userId && convo.sellerId !== userId) {
      throw new Error("Not allowed");
    }
    return ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
    type: v.optional(
      v.union(v.literal("text"), v.literal("offer"), v.literal("image")),
    ),
    offerAmount: v.optional(v.number()),
  },
  handler: async (ctx, { conversationId, body, type, offerAmount }) => {
    const senderId = await requireUserId(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo) throw new Error("Conversation not found");
    if (convo.buyerId !== senderId && convo.sellerId !== senderId) {
      throw new Error("Not allowed");
    }

    await ctx.db.insert("messages", {
      conversationId,
      senderId,
      body,
      type: type ?? "text",
      offerAmount,
    });

    // The RECIPIENT's unread count increments, never the sender's.
    const senderIsBuyer = senderId === convo.buyerId;
    await ctx.db.patch(conversationId, {
      lastMessageText: body.slice(0, 100),
      lastMessageAt: Date.now(),
      buyerUnread: senderIsBuyer ? convo.buyerUnread : convo.buyerUnread + 1,
      sellerUnread: senderIsBuyer ? convo.sellerUnread + 1 : convo.sellerUnread,
    });
  },
});

/** Clear the caller's unread count and stamp readAt on the other party's msgs. */
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await requireUserId(ctx);
    const convo = await ctx.db.get(conversationId);
    if (!convo) return;
    if (convo.buyerId !== userId && convo.sellerId !== userId) {
      throw new Error("Not allowed");
    }

    const isBuyer = convo.buyerId === userId;
    await ctx.db.patch(conversationId, isBuyer ? { buyerUnread: 0 } : { sellerUnread: 0 });

    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    const now = Date.now();
    await Promise.all(
      unread
        .filter((m) => m.senderId !== userId && m.readAt === undefined)
        .map((m) => ctx.db.patch(m._id, { readAt: now })),
    );
  },
});
