# Axis — Migration Handoff

Status snapshot for picking work back up after a context reset. Two large pieces
are **done** (component splits + full TypeScript migration); two are **queued**
(trending scalability, tests).

---

## ✅ Done this session

### 1. God-components split into sub-components
| Screen | Extracted | New files |
| --- | --- | --- |
| `ItemDetailsScreen` (939→774 ln) | image carousel, advice cards | `components/details/ImageGallery.tsx`, `components/details/TipsCard.tsx` |
| `ProfileScreen` (890→665 ln) | edit-profile layer | `components/profile/EditProfileForm.tsx` |
| `MainHomeScreen` (889→826 ln) | bottom tab bar | `components/home/BottomNav.tsx` |

(Earlier in the session the home feed sections, the safety/seller tips, and the
category/condition pickers were also de-duplicated into helpers.)

### 2. Entire frontend migrated to TypeScript (strict)
- Every `.js`/`.jsx` under `App`, `screens/`, `components/`, `config/` is now
  `.ts`/`.tsx`. **0 remaining `.js` source files** in the app.
- `config/types.ts` is the key idea: client types are **derived from the Convex
  backend** via `FunctionReturnType<typeof api.listings.feed>` etc., so the app
  and server can't drift. Reuse these (`Listing`, `Conversation`, `Message`,
  `UserProfile`, `ChatParam`, `ProfileForm`, `Origin`, `ItemPressHandler`).
- `tsconfig.json` now type-checks the app under `strict` (scoped include list;
  `convex/` keeps its own tsconfig).
- Added `npm run typecheck` → `tsc --noEmit`. **Currently green.**

### How to validate
```bash
npm run typecheck      # tsc --noEmit, must exit 0
npx expo start         # smoke-test on a device/simulator (not possible in CI here)
```
> ⚠️ The migration was verified by `tsc --strict` + Babel parsing of all 30 source
> files. It was **not** run on a simulator in this environment — do a quick manual
> smoke test (auth → home → details → chat → profile edit → create listing).

---

## 🟡 Queued — Step A: fix `trending` scalability

**File:** `convex/listings.ts` (the `trending` query, ~line 83).

**Problem:** it `.collect()`s *every* active listing and sorts in JS — O(all
active listings) reads. Fine now, a problem at scale.

**Fix:** add a composite index and let the DB do the ordering.

1. In `convex/schema.ts`, add to the `listings` table indexes:
   ```ts
   .index("by_status_and_views", ["status", "views"])
   ```
2. Rewrite the query:
   ```ts
   export const trending = query({
     args: { limit: v.optional(v.number()) },
     handler: async (ctx, { limit }) => {
       const rows = await ctx.db
         .query("listings")
         .withIndex("by_status_and_views", (q) => q.eq("status", "active"))
         .order("desc")            // views desc within status (2nd index field)
         .take(limit ?? 10);
       return Promise.all(rows.map((l) => hydrate(ctx, l)));
     },
   });
   ```
3. `npx convex dev` (or deploy) to build the index; existing rows backfill
   automatically. No client change — `api.listings.trending` keeps its shape.

**Note:** `incrementViews` patches `views`, which now writes an indexed field —
still fine, just be aware. `listConversations` has a similar N+1 shape but is
lower priority (bounded by a user's conversation count).

---

## 🟡 Queued — Step B: add tests

There is **no test runner** yet. Highest-value target is the **backend logic**
(it carries the security/correctness rules), via `convex-test` + `vitest`.

1. Install:
   ```bash
   npm i -D convex-test vitest @edge-runtime/vm
   ```
2. Add `vitest.config.ts` with the edge-runtime environment (see convex-test docs).
3. Write tests for the rules that matter most:
   - **`saved.toggleSave`** — idempotent: toggling twice returns to unsaved; no
     duplicate rows (the `by_user_and_listing` guarantee).
   - **`messages.send`** — increments only the *recipient's* unread counter, never
     the sender's; rejects a non-participant.
   - **`messages.getOrCreateConversation`** — two calls with the same
     (listing, buyer, seller) return the same id (no duplicate threads).
   - **`listings.create`/`update`** — `assertOwner` blocks a non-owner; validation
     rejects over-cap price / over-length title.
   - **`listings.feed`** — category + search filtering returns only active rows.
4. (Optional, lower ROI) component tests via `@testing-library/react-native` +
   `jest-expo`. Start with `ListingCard` and `BottomNav`.

Add an `npm test` script once the runner is in.

---

## Minor follow-ups (nice-to-have, not blocking)
- **Unused imports** linger in a couple of converted screens (e.g. `TouchableOpacity`
  in `MainHomeScreen`). Harmless; a lint pass (`eslint`/`tsc --noUnusedLocals`) would
  surface them. `noUnusedLocals` was intentionally left **off** to avoid churn from
  `import React` lines that `react-jsx` doesn't need.
- **`ImagePicker.MediaTypeOptions` is deprecated** (`CreateListingScreen.tsx`,
  `ProfileScreen.tsx`). Replace with the newer `mediaTypes: ['images']` form when
  convenient.
- **Further component extraction** (optional, lower priority — these screens are
  already reasonably factored): `ChatScreen` → `MessageBubble`; `CreateListingScreen`
  → `PhotoPicker`; `AuthFlowScreen` → move the internal `Field`/`StepDots` into
  `components/auth/`.

---

## Architecture quick-reference
- **Backend (`convex/`)** is strong: server-side auth (`lib/auth.ts`), ownership
  checks (`assertOwner`), idempotent mutations via indexes, centralized validation
  (`lib/validate.ts`), `@uwo.ca` gate in `auth.ts`. Leave it as-is except Step A.
- **Navigation** is hand-rolled in `MainHomeScreen` (tab shell + overlay state
  machine). Works; a future `react-navigation` migration is a separate large effort.
- **Design tokens** live in `config/theme.ts` (partial adoption — many screens still
  hardcode hex; opportunistic cleanup welcome).
