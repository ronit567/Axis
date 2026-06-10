import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

/**
 * Image upload flow:
 *   1. client calls generateUploadUrl()
 *   2. client POSTs the file bytes to the returned URL → gets back a storageId
 *   3. client passes that storageId into listings.create({ images: [storageId] })
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx); // only signed-in users may upload
    return ctx.storage.generateUploadUrl();
  },
});

/** Resolve a storage ID to a served URL (or null if missing). */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});
