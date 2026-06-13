import { ConvexError } from "convex/values";

/**
 * Server-side bounds on user-supplied content.
 *
 * Convex allows up to ~1MB per document and `v.string()` can't express a
 * maximum length, so without these a client that bypasses the UI could store
 * enormous payloads (storage/cost abuse) or break the app's layout. These caps
 * sit comfortably ABOVE the client's own `maxLength` props (title 100,
 * description 1000, message 500, bio 300, …) so legitimate input is never
 * rejected — they only catch abuse.
 */
export const LIMITS = {
  title: 120,
  description: 2000,
  messageBody: 2000,
  meetupLocation: 200,
  meetupAvailability: 200,
  imagesPerListing: 10,
  maxPrice: 1_000_000,
} as const;

/** Max lengths for profile fields, shared by sign-up (auth.ts) and updateProfile. */
export const PROFILE_LIMITS: Record<string, number> = {
  firstName: 80,
  lastName: 80,
  program: 120,
  yearOfStudy: 40,
  bio: 1000,
  phone: 100,
};

/** RFC 5321 caps an email address at 254 chars; the local part is otherwise unbounded. */
export const EMAIL_MAX = 254;

/**
 * Reject strings longer than `max`. No-op for `undefined`, so it's safe to call
 * on optional fields. Throws ConvexError so the message surfaces cleanly on the
 * client (see App.js's `error.data` handling).
 */
export function checkMaxLength(
  value: string | undefined,
  max: number,
  field: string,
): void {
  if (value !== undefined && value.length > max) {
    throw new ConvexError(`${field} must be ${max} characters or fewer.`);
  }
}

/**
 * Trim a required text field and reject empty/whitespace-only or over-long
 * input. Returns the trimmed value to store as the authoritative version.
 */
export function requireText(value: string, max: number, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ConvexError(`${field} is required.`);
  }
  if (trimmed.length > max) {
    throw new ConvexError(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}
