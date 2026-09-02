"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { bookingHref, type BookingSource } from "@/lib/booking";

/* Every "Book demo" on the site: a link to the /demo form.

   One control, five placements, and the only thing on the site worth
   counting. Page views already say how many people arrived; this says how
   many of them asked for a demo and which control they asked from, which
   is the question that decides what to cut. `source` is already carried in
   the URL as ?src= for the email — the event makes it countable without
   reading traffic logs.

   Client component solely for this handler. It is a leaf, so the cost is
   the handler and the link; the five callers stay server components and
   pass their arrows straight through as children.

   track() is fire-and-forget and the navigation that follows is
   client-side, so nothing races a page unload. It no-ops outside
   production, which is why this is safe to leave in during local work. */

export function BookDemo({
  source,
  className,
  children,
}: {
  source: BookingSource;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={bookingHref(source)}
      className={className}
      onClick={() => track("book_demo_click", { source })}
    >
      {children}
    </Link>
  );
}
