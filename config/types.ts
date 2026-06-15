// Shared client types derived straight from the Convex backend, so the app and
// server can never drift. Each query's return type is the source of truth —
// e.g. a listing card is typed by whatever `listings.feed` actually returns
// (hydrated with imageUrls + seller), not a hand-written duplicate.
import { FunctionReturnType } from 'convex/server';
import { Id } from '../convex/_generated/dataModel';
import { api } from '../convex/_generated/api';

/** A hydrated listing as returned by the feed/trending/saved queries. */
export type Listing = FunctionReturnType<typeof api.listings.feed>[number];

/** A conversation row with the other party + listing summary. */
export type Conversation = FunctionReturnType<typeof api.messages.listConversations>[number];

/** A single chat message. */
export type Message = FunctionReturnType<typeof api.messages.listMessages>[number];

/** The signed-in user's profile (non-null variant of users.current). */
export type UserProfile = NonNullable<FunctionReturnType<typeof api.users.current>>;

/** A seller's public profile. */
export type PublicProfile = NonNullable<FunctionReturnType<typeof api.users.publicProfile>>;

/** Editable profile fields, used by the Edit Profile form. */
export type ProfileForm = {
  firstName: string;
  lastName: string;
  program: string;
  yearOfStudy: string;
  bio: string;
};

/** On-screen rectangle of a tapped element, for the container-transform open. */
export type Origin = { x: number; y: number; width: number; height: number };

/** Opening a listing's detail view, optionally growing from the tapped card. */
export type ItemPressHandler = (item: Listing, origin?: Origin | null) => void;

/**
 * The loosely-shaped bag passed into ChatScreen. Two call sites build it
 * differently (from a conversation row vs. straight from a listing), so every
 * field is optional and the screen reads them defensively.
 */
export type ChatParam = {
  conversationId?: Id<'conversations'>;
  sellerId?: Id<'users'>;
  listingId?: Id<'listings'>;
  sellerName?: string;
  itemTitle?: string;
  itemPrice?: number;
  isBuyer?: boolean;
  listing?: {
    _id?: Id<'listings'>;
    title?: string;
    price?: number;
    imageUrl?: string | null;
  } | null;
};
