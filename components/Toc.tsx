"use client";

import { useEffect, useState } from "react";

/* Contents rail. Tracks the section in view. */

export interface TocEntry {
  id: string;
  label: string;
}

export function Toc({ entries }: { entries: readonly TocEntry[] }) {
  const [here, setHere] = useState<string | null>(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const sections = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);

    const io = new IntersectionObserver(
      (records) =>
        records.forEach((r) => {
          if (r.isIntersecting) setHere(r.target.id);
        }),
      { rootMargin: "-15% 0px -70% 0px" }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [entries]);

  return (
    <nav className="toc" aria-label="Contents">
      <span className="lbl">Contents</span>
      <ol>
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              className={here === e.id ? "here" : undefined}
              aria-current={here === e.id ? "location" : undefined}
            >
              {e.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
