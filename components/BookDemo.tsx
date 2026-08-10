"use client";

import { useCallback, type ReactNode } from "react";
import { CALENDLY_URL, bookingHref } from "@/lib/booking";

/* Every "Book demo" on the site.

   It is a real link first and a widget second. The anchor carries the
   scheduling URL, so it works with JavaScript off, with the third-party
   script blocked, on a middle-click, and on a modified click. The popup is
   an enhancement layered on top: if the widget is loaded when the click
   lands, it opens in place; if it is not, the link simply opens the
   scheduler. There is no path where a click does nothing, which is the
   failure mode of intercepting first and loading afterwards.

   Calendly's script and stylesheet are fetched on first intent, meaning
   hover, focus or touch, rather than on page load. The site otherwise
   loads nothing from a third party, and a booking widget should not be
   the thing that changes that for every visitor who never clicks it. */

declare global {
  interface Window {
    Calendly?: { initPopupWidget(options: { url: string }): void };
  }
}

const WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
const WIDGET_JS = "https://assets.calendly.com/assets/external/widget.js";

let pending: Promise<void> | null = null;

function loadWidget(): Promise<void> {
  if (typeof window === "undefined" || window.Calendly) return Promise.resolve();
  if (pending) return pending;

  pending = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${WIDGET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS;
      document.head.appendChild(css);
    }
    const js = document.createElement("script");
    js.src = WIDGET_JS;
    js.async = true;
    js.onload = () => resolve();
    js.onerror = () => reject(new Error("Calendly widget failed to load"));
    document.head.appendChild(js);
  }).catch(() => {
    // Allow a later attempt, and leave the plain link to do the work.
    pending = null;
  });

  return pending;
}

export function BookDemo({ className, children }: { className?: string; children: ReactNode }) {
  const warm = useCallback(() => {
    if (CALENDLY_URL) void loadWidget();
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!CALENDLY_URL) return;
    // Let the browser own new-tab, new-window and middle clicks.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const calendly = window.Calendly;
    if (!calendly) return;
    e.preventDefault();
    calendly.initPopupWidget({ url: CALENDLY_URL });
  }, []);

  return (
    <a
      className={className}
      href={bookingHref}
      target={CALENDLY_URL ? "_blank" : undefined}
      rel={CALENDLY_URL ? "noopener noreferrer" : undefined}
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
