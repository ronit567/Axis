# Axis 🛒

A student marketplace app for Western University, built with React Native
(Expo) and [Convex](https://convex.dev). Students sign up with their `@uwo.ca`
email, list items for sale, browse the campus feed, and message sellers in
realtime.

![Expo](https://img.shields.io/badge/Expo-54-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB)
![Convex](https://img.shields.io/badge/Backend-Convex-EE342F)

## 📱 Features

- **School-gated accounts** — email/password auth via Convex Auth; the
  `@uwo.ca` domain check is enforced server-side, and sessions persist
  securely on-device (expo-secure-store)
- **Listings** — create listings with up to 5 photos (Convex file storage),
  browse For You / Trending / Recently Listed, filter by category, condition,
  and price
- **Realtime everything** — feeds, chats, and unread badges update live via
  Convex reactive queries; no refresh button anywhere
- **Messaging** — per-listing buyer↔seller conversations with unread counts,
  read receipts, quick replies, and offer/meetup actions
- **Seller tools** — mark as sold, delete listing, view counts

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **Expo Go** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Run it

```bash
npm install

# terminal 1 — backend (writes EXPO_PUBLIC_CONVEX_URL to .env.local)
npx convex dev

# terminal 2 — app
npm start
```

Scan the QR code with your phone, or use `npm run ios` / `npm run android`
for simulators.

### Backend smoke tests

With `npx convex dev` running:

```bash
node scripts/smoke-auth.mjs $RANDOM
node scripts/smoke-listings.mjs $RANDOM
node scripts/smoke-messages.mjs $RANDOM
```

## 📁 Project Structure

```
axis/
├── App.js                 # Auth provider + screen switching
├── convex/                # Backend: schema, auth, queries & mutations
│   ├── schema.ts          # users, listings, conversations, messages
│   ├── auth.ts            # Convex Auth password provider + @uwo.ca gate
│   ├── listings.ts        # feed, trending, create, markSold, …
│   ├── messages.ts        # conversations, send, markRead, …
│   ├── users.ts           # profile queries/mutations
│   └── files.ts           # image upload URLs
├── screens/               # One file per screen
├── components/            # Shared UI (listing cards, filters, modals)
├── config/convex.js       # Shared Convex client
└── scripts/               # Backend smoke tests
```

## 🛠️ Stack

- **React Native + Expo** — app framework and tooling
- **Convex** — database, realtime queries, file storage, auth (schema and
  authorization live in version-controlled TypeScript under `convex/`)
- **Convex Auth** — email/password with secure session persistence
- **Poppins & Hammersmith One** — typography
