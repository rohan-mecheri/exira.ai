"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingSource } from "@/lib/booking";

type Status = "idle" | "submitting" | "success" | "error";

export function DemoForm() {
  const params = useSearchParams();
  const source = (params.get("src") as BookingSource | null) ?? undefined;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

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
        <textarea name="message" required rows={4} placeholder="Tell us about a target in your pipeline." />
      </label>

      {error && <p className="demo-err">{error}</p>}

      <button type="submit" className="btn btn-lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
