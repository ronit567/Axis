import { ConvexReactClient } from "convex/react";

/**
 * Shared Convex client. Mirrors the role of the old `config/supabase.js`.
 *
 * `EXPO_PUBLIC_CONVEX_URL` is written to `.env.local` automatically by
 * `npx convex dev`. Expo inlines any `EXPO_PUBLIC_*` var at build time, so no
 * extra config is needed.
 *
 * Wiring (do this when you cut a screen over to Convex — see
 * docs/06-kickoff-plan.md, Task 2): wrap the app root in App.js with
 *
 *   import { ConvexProvider } from "convex/react";
 *   import { convex } from "./config/convex";
 *   // <ConvexProvider client={convex}>...</ConvexProvider>
 *
 * Once Convex Auth is configured (Task 1), swap ConvexProvider for
 * ConvexAuthProvider and pass `storage={SecureStore}` so sessions persist on
 * device (this is what fixes the old in-memory-session bug).
 */
export const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL,
  { unsavedChangesWarning: false },
);
