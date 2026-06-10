// One-off smoke test for the Convex Auth setup (Task 1 acceptance).
// Run: node scripts/smoke-auth.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^EXPO_PUBLIC_CONVEX_URL=(.+)$/m)?.[1]?.trim();
if (!url) throw new Error("EXPO_PUBLIC_CONVEX_URL not found in .env.local");
const client = new ConvexHttpClient(url);

const PASSWORD = "smoke-test-Passw0rd!";
const uwoEmail = `smoke.test.${process.argv[2] ?? "1"}@uwo.ca`;

// 1. Non-uwo.ca email must be rejected server-side.
let rejected = false;
try {
  await client.action(api.auth.signIn, {
    provider: "password",
    params: { email: "intruder@gmail.com", password: PASSWORD, flow: "signUp" },
  });
} catch (e) {
  rejected = true;
  console.log("PASS: gmail.com sign-up rejected:", e.data ?? e.message);
}
if (!rejected) throw new Error("FAIL: non-uwo.ca sign-up was accepted!");

// 2. uwo.ca sign-up succeeds and returns tokens.
const res = await client.action(api.auth.signIn, {
  provider: "password",
  params: {
    email: uwoEmail,
    password: PASSWORD,
    flow: "signUp",
    firstName: "Smoke",
    lastName: "Test",
    program: "Computer Science",
    yearOfStudy: "3",
  },
});
if (!res?.tokens?.token) throw new Error("FAIL: sign-up returned no token");
console.log("PASS: uwo.ca sign-up returned tokens");

// 3. Authenticated users.current returns the profile created at sign-up.
client.setAuth(res.tokens.token);
const me = await client.query(api.users.current, {});
if (!me || me.email !== uwoEmail || me.firstName !== "Smoke")
  throw new Error(`FAIL: users.current mismatch: ${JSON.stringify(me)}`);
console.log("PASS: users.current:", {
  email: me.email,
  firstName: me.firstName,
  lastName: me.lastName,
  program: me.program,
});

// 4. Sign back in with the same credentials (signIn flow).
const client2 = new ConvexHttpClient(url);
const res2 = await client2.action(api.auth.signIn, {
  provider: "password",
  params: { email: uwoEmail, password: PASSWORD, flow: "signIn" },
});
if (!res2?.tokens?.token) throw new Error("FAIL: sign-in returned no token");
console.log("PASS: sign-in with existing account works");

console.log("\nAll auth smoke tests passed.");
