import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Exira collects and uses personal information on exira.ai.",
};

export default function Privacy() {
  return (
    <main>
      <div className="mast">
        <div className="wrap">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="stand">Last updated: 12 August 2026</p>
        </div>
      </div>

      <div className="wrap legal">
        <div className="essay-body">
          <section>
            <p>
              This policy describes how Exira (&quot;we&quot;, &quot;us&quot;) collects and uses
              personal information on exira.ai. It applies to this website only.
            </p>
          </section>

          <section>
            <h2>Information we collect</h2>
            <p>
              We collect information you choose to give us, and a limited amount of information
              collected automatically when you visit the site.
            </p>
            <p>
              <strong>Contact requests</strong> — when you use the demo form, we collect your
              name, email address, phone number (if given), firm name, and your message.
            </p>
            <p>
              <strong>Automatic information</strong> — like most websites, our hosting
              infrastructure records standard server logs (such as IP address, browser type and
              pages requested) to keep the site running and secure.
            </p>
          </section>

          <section>
            <h2>How we use it</h2>
            <p>
              We use the information above to respond to your inquiry and to operate and secure
              the website. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2>Where your information lives and who sees it</h2>
            <p>
              Demo form submissions are sent by email to our team through our email delivery
              provider, Resend. We share personal information only with the service providers
              that help us run the site (such as hosting and email delivery), and only for the
              purposes described here. We do not sell personal information to third parties.
            </p>
          </section>

          <section>
            <h2>Retention</h2>
            <p>
              We keep contact requests for as long as needed to respond to your inquiry, unless a
              longer period is required by law. You can ask us to delete your information at any
              time.
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <p>
              Depending on where you live (including if you are a California resident), you may
              have the right to know what personal information we hold about you, to request a
              copy of it, to correct it, or to request that we delete it. We will not discriminate
              against you for exercising any of these rights.
            </p>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will respond within
              the timeframes required by applicable law.
            </p>
          </section>

          <section>
            <h2>Changes and contact</h2>
            <p>
              If we change this policy, we will update this page and the date above. Questions
              about this policy can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
