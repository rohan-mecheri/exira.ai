/* Where every "Book demo" on the site points.

   A booking link is public by design, so the live one is the default and
   the site needs no environment setup to work. NEXT_PUBLIC_CALENDLY_URL
   still overrides it, which is how a staging deployment points at a test
   event without a code change. NEXT_PUBLIC_ values are inlined at build
   time, so changing one needs a rebuild, not just an env edit.

   If the URL is ever emptied, every control falls back to the mailto:
   nothing here can produce a dead button. */

export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() || "https://calendly.com/rmecheri-andrew/30min";

/** Used if the scheduler is unset, and if its script fails to load. */
export const BOOKING_FALLBACK = "mailto:hello@exira.io?subject=Exira%20demo";

/** Which control a booking came from. Lands on the Calendly booking as
    utm_content, so it is visible without any analytics being installed. */
export type BookingSource = "nav" | "hero" | "close" | "footer" | "thesis";

/* Calendly reads UTM parameters straight off the scheduling URL and
   attaches them to the booking, so tagging the link is all it takes to
   see which control produced a meeting. */
export function bookingHref(source: BookingSource): string {
  if (!CALENDLY_URL) return BOOKING_FALLBACK;
  const url = new URL(CALENDLY_URL);
  url.searchParams.set("utm_source", "exira.ai");
  url.searchParams.set("utm_medium", "website");
  url.searchParams.set("utm_content", source);
  return url.toString();
}
