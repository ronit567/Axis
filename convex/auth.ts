import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { PROFILE_LIMITS, EMAIL_MAX } from "./lib/validate";

/**
 * Server-side school-domain gate. The old app only checked this on the
 * client, which was trivially bypassable.
 */
const UWO_EMAIL = /^[A-Za-z0-9._%+-]+@uwo\.ca$/i;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // Called with the params the client passes to signIn("password", ...).
      // The returned object becomes the new row in `users` on sign-up, so the
      // profile is created in the same flow as the account — no trigger races.
      profile(params) {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        // The regex's local part is unbounded, so cap length explicitly — the
        // sign-up form imposes the same 254 limit, this guards the API directly.
        if (email.length > EMAIL_MAX) {
          throw new ConvexError("That email address is too long.");
        }
        if (!UWO_EMAIL.test(email)) {
          throw new ConvexError(
            "Axis is only available to Western students — sign up with your @uwo.ca email.",
          );
        }
        // Only include keys that actually have a value — Convex's `profile`
        // return type forbids `undefined`, so absent fields must be omitted
        // rather than set to undefined.
        const optionalFields: Record<string, string> = {};
        for (const key of [
          "firstName",
          "lastName",
          "program",
          "yearOfStudy",
          "bio",
          "phone",
        ]) {
          const value = params[key];
          if (typeof value === "string" && value.trim()) {
            const trimmed = value.trim();
            const max = PROFILE_LIMITS[key];
            // The sign-up form has no client-side maxLength, so this is the only
            // bound on these fields — reject oversized rather than truncate.
            if (max && trimmed.length > max) {
              throw new ConvexError(`${key} must be ${max} characters or fewer.`);
            }
            optionalFields[key] = trimmed;
          }
        }
        return { email, ...optionalFields };
      },
    }),
  ],
});
