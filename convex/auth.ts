import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

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
            optionalFields[key] = value.trim();
          }
        }
        return { email, ...optionalFields };
      },
    }),
  ],
});
