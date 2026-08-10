/* Where every "Book demo" on the site points.

   The scheduler URL is read from the environment rather than hardcoded so
   it can be set per deployment without a code change. Until it is set,
   every booking control falls back to the mailto it used before: an unset
   variable must never produce a dead button, which is what a hardcoded
   placeholder would have done.

   To turn Calendly on, set NEXT_PUBLIC_CALENDLY_URL to the event's
   scheduling link and redeploy. NEXT_PUBLIC_ values are inlined at build
   time, so a change needs a rebuild, not just an env edit. */

export const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() || "";

/** Used until the scheduler is configured, and if its script fails to load. */
export const BOOKING_FALLBACK = "mailto:hello@exira.io?subject=Exira%20demo";

/** The href every booking control renders, whichever of the two is live. */
export const bookingHref = CALENDLY_URL || BOOKING_FALLBACK;
