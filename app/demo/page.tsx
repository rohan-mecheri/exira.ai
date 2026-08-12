import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DemoForm } from "@/components/DemoForm";
import { CONTACT_EMAIL } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Book demo",
  description: "Tell us about a target in your pipeline and we'll set up a walkthrough of the assessment.",
};

export default function Demo() {
  return (
    <main>
      <section className="demo sec">
        <div className="wrap demo-grid">
          <div>
            <p className="eyebrow">Book demo</p>
            <h1>Tell us about a target.</h1>
            <p className="lede">We&apos;ll walk you through a full assessment on a deal in your pipeline.</p>
            <div className="demo-reach">
              <p className="eyebrow">Reach us directly</p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <p className="demo-fine">
                We use these details only to respond to your inquiry. See our{" "}
                <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </div>
          </div>
          <div className="demo-panel">
            <Suspense>
              <DemoForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
