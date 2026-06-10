// One-off smoke test for the listings slice (Task 3 acceptance).
// Run: node scripts/smoke-listings.mjs <random-suffix>
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^EXPO_PUBLIC_CONVEX_URL=(.+)$/m)?.[1]?.trim();
const seller = new ConvexHttpClient(url);
const browser = new ConvexHttpClient(url); // separate unauthenticated client

const suffix = process.argv[2] ?? "1";
const { tokens } = await seller.action(api.auth.signIn, {
  provider: "password",
  params: {
    email: `seller.${suffix}@uwo.ca`,
    password: "smoke-test-Passw0rd!",
    flow: "signUp",
    firstName: "Sally",
    lastName: "Seller",
  },
});
seller.setAuth(tokens.token);

// Listing priced over the old broken $100 default filter
const listingId = await seller.mutation(api.listings.create, {
  title: `Standing Desk ${suffix}`,
  description: "Barely used",
  price: 250,
  category: "Furniture",
  condition: "Like New",
  images: [],
  meetupLocation: "UCC",
});
console.log("PASS: listing created:", listingId);

// Another "device": unauthenticated feed must show it, hydrated
const feed = await browser.query(api.listings.feed, {});
const found = feed.find((l) => l._id === listingId);
if (!found) throw new Error("FAIL: created listing not in feed");
if (found.status !== "active") throw new Error("FAIL: status mismatch");
if (found.seller?.firstName !== "Sally") throw new Error("FAIL: seller not hydrated");
if (!Array.isArray(found.imageUrls)) throw new Error("FAIL: imageUrls missing");
console.log("PASS: feed shows the $250 listing with hydrated seller");

// incrementViews + getById
await browser.mutation(api.listings.incrementViews, { id: listingId });
const detail = await browser.query(api.listings.getById, { id: listingId });
if (detail.views !== 1) throw new Error(`FAIL: views=${detail.views}`);
console.log("PASS: incrementViews + getById");

// Owner-only: markSold by the owner works; remove drops it from the feed
await seller.mutation(api.listings.markSold, { id: listingId });
const afterSold = await browser.query(api.listings.feed, {});
if (afterSold.some((l) => l._id === listingId))
  throw new Error("FAIL: sold listing still in feed");
console.log("PASS: markSold removes it from the active feed");

// Non-owner mutation must be rejected
let blocked = false;
try {
  await browser.mutation(api.listings.remove, { id: listingId });
} catch {
  blocked = true;
}
if (!blocked) throw new Error("FAIL: unauthenticated remove was allowed");
console.log("PASS: non-owner mutations rejected");

console.log("\nAll listings smoke tests passed.");
