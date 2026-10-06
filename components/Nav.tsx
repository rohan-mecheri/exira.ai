"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "./Arrow";
import { BookDemo } from "./BookDemo";

/* ══════════════════════════════════════════════════════════
   The running head.

   The site reads as one long document, so the header behaves like the
   head of one. At the top of a page it is a quiet bar on the ground.
   Once the page moves, it pins, takes a surface and a hairline, and its
   centre carries the title of the section you are reading, the way a
   printed report repeats its section title at the top of every page. A
   1px rule along its bottom edge fills with your place in the document.

   Book demo is in the bar at every scroll position on every route.

   One copy, shared by every route. Section links resolve against the
   home page, so from /privacy they carry the leading slash and from / they
   stay as bare fragments, otherwise the browser would treat them as a
   navigation and lose the smooth in-page scroll.

   Scroll work is one passive listener batched to a frame. The progress
   rule is written straight to a CSS variable, so scrolling never
   re-renders React; state changes only when the section does.
   ══════════════════════════════════════════════════════════ */

const SECTIONS = [
  { id: "security", label: "Isolation" },
  { id: "coverage", label: "Modules" },
  { id: "report", label: "Report" },
];

/** A heading's text as it reads on screen. textContent runs block-level
    children together ("Technical diligence" + a block "for private
    capital" would read "diligencefor"), so those are joined by a space. */
function readText(el: Element): string {
  const parts: string[] = [];
  el.childNodes.forEach((n) => {
    const block = n instanceof HTMLElement && getComputedStyle(n).display !== "inline";
    parts.push(block ? ` ${n.textContent ?? ""} ` : (n.textContent ?? ""));
  });
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** Phone running head off the home page: the page, not its section. */
const PAGES: Record<string, string> = {
  "/privacy": "Privacy",
  "/demo": "Book a demo",
};

/** Pinned bar height. Mirrored as --nav-pin in base.css for anything
    sticky that has to clear it. */
const PIN_H = 56;

export function Nav() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [head, setHead] = useState({ full: "", short: "" });
  const [here, setHere] = useState<string | null>(null);
  // Menu subtitles: each section's own heading, read from the page so the
  // menu can never drift from the copy. Only available on the home page.
  const [subs, setSubs] = useState<Record<string, string>>({});

  const barRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // On the home page these are in-document jumps; anywhere else they are
  // links back to it.
  const to = (id: string) => (home ? `#${id}` : `/#${id}`);

  /* Scroll position: pinned state, running head, current section and the
     progress rule. */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--p", max > 0 ? String(Math.min(1, y / max)) : "0");

      // The current section is the last one whose top has passed under
      // the bar. Its heading becomes the running head; on the home page
      // the hero has none, and on other pages the h1 stands in until
      // the first section is reached.
      const line = PIN_H + 1;
      let title = "";
      let id: string | null = null;
      const main = document.querySelector("main");
      if (main) {
        const h1 = main.querySelector("h1");
        if (!home && h1 && h1.getBoundingClientRect().bottom < line) {
          title = readText(h1);
        }
        main.querySelectorAll<HTMLElement>("section").forEach((s) => {
          if (s.getBoundingClientRect().top >= line) return;
          // The problem section leads with a standfirst rather than an h2;
          // it is still that section's title.
          const h2 = s.querySelector("h2, .gap-lede");
          if (h2) {
            title = readText(h2).replace(/\.$/, "") || title;
            id = s.id || null;
          } else if (home) {
            title = "";
            id = null;
          }
        });
      }
      // Phones show the short label where a section has one: a running
      // head cut off mid-word reads worse than a shorter one.
      const short = !title
        ? ""
        : home
          ? (SECTIONS.find((s) => s.id === id)?.label ?? (title.startsWith("Every software deal") ? "The problem" : title))
          : (PAGES[pathname] ?? title);
      setHead((h) => (h.full === title && h.short === short ? h : { full: title, short }));
      setHere(id);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, [pathname, home]);

  /* The mobile menu: Escape and an outside press close it, and focus
     moves into it on open and back to the button on close. */
  useEffect(() => {
    if (!open) return;
    if (home) {
      const next: Record<string, string> = {};
      for (const { id } of SECTIONS) {
        const h = document.getElementById(id)?.querySelector("h2")?.textContent?.trim();
        if (h) next[id] = h.replace(/\.$/, "");
      }
      setSubs(next);
    }
    const menu = menuRef.current;
    menu?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu?.contains(t) && !burgerRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, home]);

  // A route change always closes the menu.
  useEffect(() => setOpen(false), [pathname]);

  const links = (
    <>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={to(s.id)}
          aria-current={home && here === s.id ? "location" : undefined}
        >
          {s.label}
        </a>
      ))}
    </>
  );

  return (
    <>
      <header
        ref={barRef}
        className="nav"
        data-scrolled={scrolled || open ? "" : undefined}
        data-open={open ? "" : undefined}
      >
        <div className="wrap nav-in">
          <Link href={home ? "#top" : "/"} className="nav-home" aria-label="Exira home">
            <svg className="logo" aria-hidden="true" focusable="false">
              <use href="#sym-lockup" />
            </svg>
            <svg className="nav-mark" aria-hidden="true" focusable="false">
              <use href="#sym-icon" />
            </svg>
          </Link>

          {/* Visual only: the current section is already announced on its
              link through aria-current. */}
          <p className="nav-head" aria-hidden="true">
            <span key={head.full} className="nav-head-full">{head.full}</span>
            <span key={`s-${head.short}`} className="nav-head-short">{head.short}</span>
          </p>

          <nav className="nav-links" aria-label="Primary">
            {links}
          </nav>

          <BookDemo source="nav" className="btn btn-nav">
            Book demo
            <ArrowRight />
          </BookDemo>

          <button
            ref={burgerRef}
            className="burger"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
              <rect className="b1" width="18" height="1.5" />
              <rect className="b2" y="5.25" width="18" height="1.5" />
              <rect className="b3" y="10.5" width="18" height="1.5" />
            </svg>
          </button>
        </div>

        <div
          ref={menuRef}
          id="nav-menu"
          className="nav-menu"
          hidden={!open}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <nav className="wrap" aria-label="Primary">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={to(s.id)}
                aria-current={home && here === s.id ? "location" : undefined}
              >
                {s.label}
                {subs[s.id] && <small>{subs[s.id]}</small>}
              </a>
            ))}
          </nav>
        </div>

        <span className="nav-progress" aria-hidden="true" />
      </header>
      {open && <div className="nav-scrim" aria-hidden="true" />}
      <div className="nav-space" aria-hidden="true" />
    </>
  );
}
