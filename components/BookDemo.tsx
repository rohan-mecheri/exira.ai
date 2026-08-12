import type { ReactNode } from "react";
import Link from "next/link";
import { bookingHref, type BookingSource } from "@/lib/booking";

/* Every "Book demo" on the site: a link to the /demo form. */

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
    <Link href={bookingHref(source)} className={className}>
      {children}
    </Link>
  );
}
