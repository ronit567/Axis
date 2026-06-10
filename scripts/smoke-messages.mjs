// One-off smoke test for the messaging slice (Task 4 acceptance).
// Run: node scripts/smoke-messages.mjs <random-suffix>
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^EXPO_PUBLIC_CONVEX_URL=(.+)$/m)?.[1]?.trim();
const suffix = process.argv[2] ?? "1";
const PASSWORD = "smoke-test-Passw0rd!";

async function signUp(first, emailPrefix) {
  const client = new ConvexHttpClient(url);
  const { tokens } = await client.action(api.auth.signIn, {
    provider: "password",
    params: {
      email: `${emailPrefix}.${suffix}@uwo.ca`,
      password: PASSWORD,
      flow: "signUp",
      firstName: first,
      lastName: "Smoke",
    },
  });
  client.setAuth(tokens.token);
  const me = await client.query(api.users.current, {});
  return { client, id: me._id };
}

const seller = await signUp("Sue", "msg.seller");
const buyer = await signUp("Bob", "msg.buyer");

const listingId = await seller.client.mutation(api.listings.create, {
  title: `Calc Textbook ${suffix}`,
  price: 40,
  category: "Books",
  condition: "Good",
  images: [],
});

// Buyer opens a chat from the listing — idempotency check included
const convId = await buyer.client.mutation(api.messages.getOrCreateConversation, {
  listingId,
  sellerId: seller.id,
});
const convId2 = await buyer.client.mutation(api.messages.getOrCreateConversation, {
  listingId,
  sellerId: seller.id,
});
if (convId !== convId2) throw new Error("FAIL: duplicate conversation created");
console.log("PASS: getOrCreateConversation is idempotent");

// Buyer sends → SELLER's unread must increment (Bug 6 regression check)
await buyer.client.mutation(api.messages.send, {
  conversationId: convId,
  body: "Is this still available?",
});
const sellerConvos = await seller.client.query(api.messages.listConversations, {});
const sc = sellerConvos.find((c) => c._id === convId);
if (sc.unread !== 1) throw new Error(`FAIL: seller unread=${sc.unread}, want 1`);
if (sc.isBuyer) throw new Error("FAIL: seller flagged as buyer");
if (sc.otherUser?.firstName !== "Bob") throw new Error("FAIL: otherUser wrong");
console.log("PASS: recipient's unread incremented (Bug 6 fixed)");

// Buyer's own list shows zero unread
const buyerConvos = await buyer.client.query(api.messages.listConversations, {});
const bc = buyerConvos.find((c) => c._id === convId);
if (bc.unread !== 0) throw new Error(`FAIL: buyer unread=${bc.unread}, want 0`);
console.log("PASS: sender's unread untouched");

// Seller replies, reads; buyer reads → counts clear, readAt stamped
await seller.client.mutation(api.messages.send, {
  conversationId: convId,
  body: "Yes! Pick up at UCC?",
});
await seller.client.mutation(api.messages.markRead, { conversationId: convId });
await buyer.client.mutation(api.messages.markRead, { conversationId: convId });

const msgs = await buyer.client.query(api.messages.listMessages, { conversationId: convId });
if (msgs.length !== 2) throw new Error(`FAIL: ${msgs.length} messages, want 2`);
if (msgs.some((m) => m.readAt === undefined)) throw new Error("FAIL: readAt missing");
const sellerAfter = await seller.client.query(api.messages.listConversations, {});
if (sellerAfter.find((c) => c._id === convId).unread !== 0)
  throw new Error("FAIL: seller unread not cleared");
console.log("PASS: markRead clears unread and stamps readAt");

// Outsider cannot read the thread
const outsider = await signUp("Eve", "msg.outsider");
let blocked = false;
try {
  await outsider.client.query(api.messages.listMessages, { conversationId: convId });
} catch {
  blocked = true;
}
if (!blocked) throw new Error("FAIL: outsider could read messages");
console.log("PASS: non-participants rejected");

console.log("\nAll messaging smoke tests passed.");
