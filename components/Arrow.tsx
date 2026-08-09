/* The two arrows that ship with every CTA. Inline SVG rather than an icon
   font, and a component rather than six copies of the same nine paths. */

export function ArrowRight() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M1 6h9M6.5 2.5 10 6l-3.5 3.5" />
    </svg>
  );
}

export function ArrowDown() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 1v9M2.5 6.5 6 10l3.5-3.5" />
    </svg>
  );
}
