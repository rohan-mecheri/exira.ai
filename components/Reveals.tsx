"use client";

import { useEffect } from "react";

/* One-shot scroll reveals. Unobserved after firing.

   Renders nothing — it wires the .rv elements the page has already laid
   out. Mount it as the last child of a page rather than the layout, so it
   re-runs on client-side navigation; a layout-level effect would fire once
   and leave every .rv on a later visit stuck at opacity 0. */

export function Reveals() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".rv");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || reduce) {
      targets.forEach((el) => el.classList.add("on"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("on");
          io.unobserve(e.target);
        }),
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
