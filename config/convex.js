import { ConvexReactClient } from "convex/react";

/**
 * Shared Convex client.
 *
 * `EXPO_PUBLIC_CONVEX_URL` is written to `.env.local` automatically by
 * `npx convex dev`. Expo inlines any `EXPO_PUBLIC_*` var at build time, so no
 * extra config is needed.
 *
 * App.js wraps the root in `ConvexAuthProvider` with this client and
 * expo-secure-store as session storage (sessions survive cold starts).
 * Screens use the hooks from "convex/react"; event handlers outside React
 * can call `convex.query(...)` / `convex.mutation(...)` directly.
 */
export const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL,
  { unsavedChangesWarning: false },
);
