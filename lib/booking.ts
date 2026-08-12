/* Where every "Book demo" on the site points, and where a submission
   ends up. One address, used by the API route that sends the email and
   by the "reach us directly" line on the form itself. */

export type BookingSource = "nav" | "hero" | "close" | "footer" | "thesis";

export const CONTACT_EMAIL = "sales@exira.ai";

export function bookingHref(source: BookingSource): string {
  return `/demo?src=${source}`;
}
