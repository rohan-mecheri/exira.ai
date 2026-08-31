import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/booking";
import { clientKey, rateLimit, release } from "@/lib/rate-limit";

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

   1. Rate limit, first, off the headers alone. It has to come before the
      body is read, or the most expensive request to serve is the one that
      never gets counted: a caller looping oversized bodies would be
      buffered and rejected every time while the limiter that exists to
      blunt exactly that never records a thing.
   2. Body size, by bytes. Content-Length is checked before reading so an
      oversized body can be refused without buffering it, and the read is
      measured again afterwards because that header is advisory and absent
      on a chunked request.
   3. Honeypot and elapsed time. Neither rejects. Both are client-supplied
      and forgeable, and their failure mode is discarding a real enquiry
      while telling the sender it arrived — so a submission they flag is
      still delivered, marked, rather than dropped. See SUSPECT below.
   4. Field validation, with lengths. Without caps the message field is an
      open channel into an inbox, and `firm` reaches a mail header.

   None of this is a substitute for a durable store; see README. */

const MAX_BODY_BYTES = 20_000;

/* Prefixes the subject of anything the bot checks flagged. The point is
   that it still arrives: a filter can put these somewhere else, and a
   filter is reversible in a way that a discarded sales enquiry is not. To
   go back to dropping them instead, return { ok: true } without sending
   wherever `suspect` is non-empty below. */
const SUSPECT_TAG = "[suspect]";

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

type FieldName = (typeof FIELDS)[number]["name"];

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

export async function POST(request: Request) {
  const key = clientKey(request);
  const verdict = rateLimit(key);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later, or email us directly." },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfter) } }
    );
  }

  const tooLarge = () =>
    NextResponse.json({ error: "That message is too long." }, { status: 413 });

  // Advisory, and absent on a chunked request — so it is a cheap way to
  // refuse without buffering, not the measurement itself.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return tooLarge();

  const raw = await request.text();
  // Bytes, not characters. A string of astral-plane characters is four
  // bytes each on the wire and would clear a .length check at a quarter of
  // its real weight.
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return tooLarge();

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

  /* Both signals are recorded rather than acted on. A flagged submission
     is still delivered — tagged, so it can be filtered — because the cost
     of being wrong is a sales enquiry destroyed while its sender is shown
     "Message sent." A tagged email in the wrong folder is recoverable;
     that is not. */
  const suspect: string[] = [];
  // A field no human can see, so anything in it was not typed by one.
  if (typeof body.referrer === "string" && body.referrer.trim()) {
    suspect.push("honeypot filled");
  }
  const elapsed = body.elapsedMs;
  if (typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed < MIN_ELAPSED_MS) {
    suspect.push(`submitted in ${Math.round(elapsed)}ms`);
  }
  if (suspect.length) console.warn(`Contact form: ${suspect.join(", ")} from ${key}.`);

  /* Past this point a flagged submission must not be able to tell a
     rejection from a success, or the flags become an oracle for working
     out which check fired. Anything it would learn from is answered with
     the same 200 a real send gets. */
  const opaque = (response: NextResponse) =>
    suspect.length ? NextResponse.json({ ok: true }) : response;

  const values: Partial<Record<FieldName, string>> = {};
  for (const field of FIELDS) {
    const value = body[field.name];
    if (value === undefined || value === null || value === "") {
      if (field.required) {
        return opaque(NextResponse.json({ error: `Missing ${field.name}.` }, { status: 400 }));
      }
      continue;
    }
    if (typeof value !== "string") {
      return opaque(NextResponse.json({ error: `Invalid ${field.name}.` }, { status: 400 }));
    }
    const trimmed = value.trim();
    if (field.required && !trimmed) {
      return opaque(NextResponse.json({ error: `Missing ${field.name}.` }, { status: 400 }));
    }
    if (trimmed.length > field.max) {
      return opaque(NextResponse.json({ error: `That ${field.name} is too long.` }, { status: 400 }));
    }
    values[field.name] = trimmed;
  }

  const { firstName, lastName, email, phone, firm, message } = values;
  if (!firstName || !lastName || !email || !firm || !message) {
    // Unreachable: the loop above rejects any missing required field.
    // Kept so the types know it too, rather than asserting it away.
    return opaque(NextResponse.json({ error: "Invalid request body." }, { status: 400 }));
  }
  if (!isEmail(email)) {
    return opaque(NextResponse.json({ error: "Invalid email address." }, { status: 400 }));
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
    release(key);
    return opaque(
      NextResponse.json(
        { error: "The contact form isn't configured yet. Email us directly instead." },
        { status: 500 }
      )
    );
  }

  const resend = new Resend(apiKey);
  const subject = `Demo request — ${oneLine(firm)}`;

  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL || "Exira Website <onboarding@resend.dev>",
    to: process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL,
    replyTo: email,
    subject: suspect.length ? `${SUSPECT_TAG} ${subject}` : subject,
    text: [
      `${firstName} ${lastName} <${email}>`,
      phone ? `Phone: ${phone}` : null,
      `Firm: ${firm}`,
      source ? `Source: ${source}` : null,
      suspect.length ? `Flagged: ${suspect.join(", ")}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    console.error("Resend send failed:", error);
    release(key);
    return opaque(
      NextResponse.json({ error: "Couldn't send that. Try emailing us directly." }, { status: 502 })
    );
  }

  return NextResponse.json({ ok: true });
}
