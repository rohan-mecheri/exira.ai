import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/booking";

/* Sends a /demo submission to CONTACT_EMAIL via Resend.

   Requires RESEND_API_KEY (from resend.com) at runtime. CONTACT_FROM_EMAIL
   is the verified sending address for that Resend account/domain — until
   one is set, this falls back to Resend's shared test address, which only
   delivers to the account owner's own inbox. */

const REQUIRED = ["firstName", "lastName", "email", "firm", "message"] as const;

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  for (const field of REQUIRED) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return NextResponse.json({ error: `Missing ${field}.` }, { status: 400 });
    }
  }
  if (!isEmail(body.email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — contact form cannot send.");
    return NextResponse.json(
      { error: "The contact form isn't configured yet. Email us directly instead." },
      { status: 500 }
    );
  }

  const { firstName, lastName, email, phone, firm, message, source } = body;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL || "Exira Website <onboarding@resend.dev>",
    to: CONTACT_EMAIL,
    replyTo: email,
    subject: `Demo request — ${firm}`,
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
