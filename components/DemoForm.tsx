"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingSource } from "@/lib/booking";

type Status = "idle" | "submitting" | "success" | "error";

export function DemoForm() {
  const params = useSearchParams();
  const source = (params.get("src") as BookingSource | null) ?? undefined;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  /* How long the form was open before it was submitted. Sent as an
     elapsed figure rather than a timestamp so a client whose clock is
     wrong is not penalised for it. The endpoint reads it as one weak
     signal among several — see the note there. */
  const openedAt = useRef(Date.now());

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      phone: form.get("phone"),
      firm: form.get("firm"),
      message: form.get("message"),
      referrer: form.get("referrer"),
      elapsedMs: Date.now() - openedAt.current,
      source,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="demo-done">
        <h3>Message sent.</h3>
        <p className="lede">We&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form className="demo-form" onSubmit={onSubmit}>
      <div className="demo-row">
        <label>
          <span className="demo-lbl">
            First name<i aria-hidden="true">*</i>
          </span>
          <input name="firstName" type="text" required autoComplete="given-name" />
        </label>
        <label>
          <span className="demo-lbl">
            Last name<i aria-hidden="true">*</i>
          </span>
          <input name="lastName" type="text" required autoComplete="family-name" />
        </label>
      </div>
      <div className="demo-row">
        <label>
          <span className="demo-lbl">
            Email<i aria-hidden="true">*</i>
          </span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          <span className="demo-lbl">Phone number</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      <label>
        <span className="demo-lbl">
          Firm name<i aria-hidden="true">*</i>
        </span>
        <input name="firm" type="text" required autoComplete="organization" />
      </label>
      <label>
        <span className="demo-lbl">
          Message<i aria-hidden="true">*</i>
        </span>
        <textarea name="message" required rows={4} />
      </label>

      {/* Honeypot. Not a real field: hidden from sight, skipped by the
          keyboard, and hidden from assistive technology, so nobody filling
          this form in can reach it — which is what makes a value in it a
          signal rather than a guess.

          Named 'referrer' on purpose. The obvious choices — website, url,
          company, nickname — are all names a browser or password manager
          will autofill, and an autofilled honeypot silently discards a
          real submission. That is the expensive direction to be wrong in,
          so the name avoids every standard autocomplete token and opts out
          besides. The bots this catches fill every input they find; none
          of them need tempting. */}
      <div className="demo-hp" aria-hidden="true">
        <label>
          Referrer
          <input name="referrer" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && <p className="demo-err">{error}</p>}

      <button type="submit" className="btn btn-lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
