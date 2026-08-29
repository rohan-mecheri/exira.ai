import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/booking";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/* Sends a /demo submission to CONTACT_EMAIL via Resend.

   Requires RESEND_API_KEY (from resend.com) at runtime. CONTACT_FROM_EMAIL
   is the verified sending address for that Resend account/domain — until
   one is set, this falls back to Resend's shared test address, which only
   delivers to the account owner's own inbox.

   CONTACT_TO_EMAIL is where submissions actually land, which is not
   necessarily the address the page prints. CONTACT_EMAIL is public copy —
   it appears on /demo and throughout the privacy policy as the address to
   write to — so routing notifications elsewhere should not mean editing
   what a reader sees. Unset it and this falls back to CONTACT_EMAIL.

   ── What guards this, and in what order ──────────────────────────────
   It is a public POST that sends mail on demand, so it is worth stating
   what each layer is actually for.

   1. Body size, before parsing. JSON.parse on an unbounded string is the
      cheapest denial of service available to a caller.
   2. Rate limit, before anything expensive and before the honeypot. A
      caller making six requests an hour is not booking a demo, whatever
      the payload says, and a bot that discovers the honeypot should not
      get an unlimited number of tries at working around it.
   3. Honeypot and elapsed time. Both fail silently with 200: a bot told
      "rejected" learns which signal caught it, and adapts. A bot told
      "sent" goes away satisfied. Neither is trusted on its own — both are
      client-supplied and forgeable — which is why they sit behind the
      limiter rather than in front of it.
   4. Field validation, with lengths. Without caps the message field is an
      open channel into an inbox, and `firm` reaches a mail header.

   None of this is a substitute for a durable store; see README. */

const MAX_BODY_BYTES = 20_000;

/* The gap between a person and a script is enormous here — a programmatic
   post lands in tens of milliseconds, while a page has to be read before
   anyone can fill it in — so the threshold sits low deliberately. It only
   has to clear zero to catch what it catches, and every millisecond above
   that is another chance to discard a real submission from someone who
   autofilled and clicked straight through. Absent or malformed, the check
   is skipped rather than failed: a stale cached client should not be
   locked out by a field it does not know to send. */
const MIN_ELAPSED_MS = 1500;

/* Caps sized to the field, not to the database. `message` is the only one
   anybody writes prose into; the rest are names. */
const FIELDS = [
  { name: "firstName", required: true, max: 100 },
  { name: "lastName", required: true, max: 100 },
  { name: "email", required: true, max: 254 },
  { name: "phone", required: false, max: 40 },
  { name: "firm", required: true, max: 200 },
  { name: "message", required: true, max: 5000 },
] as const;

const SOURCES = ["nav", "hero", "close", "footer", "thesis"] as const;

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* Anything reaching a mail header gets its line breaks removed. The Resend
   SDK posts JSON rather than assembling SMTP, so this is not the last line
   of defence against header injection — but a subject is a single line by
   definition, and a value that arrives with newlines in it is telling you
   something either way. */
function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/* What a bot sees when the honeypot or the timing check fires. Identical
   in shape and status to a real success, so the two cannot be told apart
   from the outside. */
function silentOk() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "That message is too long." }, { status: 413 });
  }

  const key = clientKey(request);
  const verdict = rateLimit(key);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later, or email us directly." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfter) } }
    );
  }

  let body: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    body = null;
  }
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // A field no human can see, so anything in it was not typed by one.
  if (typeof body.referrer === "string" && body.referrer.trim()) {
    console.warn(`Contact form: honeypot tripped from ${key}.`);
    return silentOk();
  }

  const elapsed = body.elapsedMs;
  if (typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed < MIN_ELAPSED_MS) {
    console.warn(`Contact form: submitted in ${elapsed}ms from ${key}.`);
    return silentOk();
  }

  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = body[field.name];
    if (value === undefined || value === null || value === "") {
      if (field.required) {
        return NextResponse.json({ error: `Missing ${field.name}.` }, { status: 400 });
      }
      continue;
    }
    if (typeof value !== "string") {
      return NextResponse.json({ error: `Invalid ${field.name}.` }, { status: 400 });
    }
    const trimmed = value.trim();
    if (field.required && !trimmed) {
      return NextResponse.json({ error: `Missing ${field.name}.` }, { status: 400 });
    }
    if (trimmed.length > field.max) {
      return NextResponse.json({ error: `That ${field.name} is too long.` }, { status: 400 });
    }
    values[field.name] = trimmed;
  }

  if (!isEmail(values.email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Which control they came from. Echoed into the email, so it is checked
  // against the list rather than passed through.
  const source =
    typeof body.source === "string" && (SOURCES as readonly string[]).includes(body.source)
      ? body.source
      : null;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — contact form cannot send.");
    return NextResponse.json(
      { error: "The contact form isn't configured yet. Email us directly instead." },
      { status: 500 }
    );
  }

  const { firstName, lastName, email, phone, firm, message } = values;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL || "Exira Website <onboarding@resend.dev>",
    to: process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL,
    replyTo: email,
    subject: `Demo request — ${oneLine(firm)}`,
    text: [
      `${firstName} ${lastName} <${email}>`,
      phone ? `Phone: ${phone}` : null,
      `Firm: ${firm}`,
      source ? `Source: ${source}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    console.error("Resend send failed:", error);
    return NextResponse.json({ error: "Couldn't send that. Try emailing us directly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
