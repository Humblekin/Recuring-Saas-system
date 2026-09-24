import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: 23 September 2026.</p>

      <h2>1. Who we are</h2>
      <p>
        Kivaro is a fundraising platform that helps organizations in Ghana collect
        one-time and recurring contributions through mobile money (MTN Mobile
        Money). This policy explains what personal data we collect, why we collect
        it, and how you can exercise your rights.
      </p>

      <h2>2. Data we collect</h2>
      <h3>2.1 Supporter payments</h3>
      <p>
        When you make a contribution, we collect your name, email address, and MTN
        Mobile Money phone number, together with the amount, currency, and timing of
        your contribution. This information is used to process your payment, send
        you a receipt, and, if you choose a recurring contribution, bill you on your
        chosen schedule.
      </p>
      <h3>2.2 Account data</h3>
      <p>
        If you create a Kivaro account, we store your name, email address, and the
        organizations and campaigns you administer.
      </p>
      <h3>2.3 Technical data</h3>
      <p>
        Our servers automatically record basic technical information such as IP
        address, browser type, and pages visited, for security and troubleshooting.
      </p>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To process contributions and recurring payments through MTN Mobile Money.</li>
        <li>To issue receipts and payment confirmations.</li>
        <li>To keep accounts and payment records accurate.</li>
        <li>To prevent fraud, abuse, and unauthorized access.</li>
        <li>To meet legal, tax, and accounting obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we never store or
        handle your MTN Mobile Money PIN.
      </p>

      <h2>4. Legal basis</h2>
      <p>
        We process personal data on the basis of contract (processing your
        contribution), legitimate interest (fraud prevention and platform
        security), and legal obligation where applicable.
      </p>

      <h2>5. Sharing your data</h2>
      <p>
        We share personal data only with service providers strictly necessary to
        operate the platform:
      </p>
      <ul>
        <li>
          <strong>MTN Mobile Money (MTN MoMo):</strong> phone numbers and payment
          details are sent to MTN to initiate and settle contributions.
        </li>
        <li>
          <strong>Neon (database and authentication):</strong> our database and
          sign-in service are hosted by Neon. Your account and payment records are
          stored in Neon&rsquo;s managed Postgres service.
        </li>
      </ul>
      <p>
        We never sell data to advertisers and never share data with third parties
        for their own marketing.
      </p>

      <h2>6. Security</h2>
      <p>
        We protect your data with encrypted connections (HTTPS), parameterized
        database queries, session-based authentication, and restricted access to
        production credentials. Payments are processed directly by MTN under its
        own security controls.
      </p>

      <h2>7. Data retention</h2>
      <p>
        Payment and contribution records are retained for as long as required for
        auditing, tax, and accounting purposes, and longer where the organization
        you supported relies on them for its records. Account data is kept while
        your account is active.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Subject to applicable law, you may request access to, correction of, or
        deletion of the personal data we hold about you, or withdraw consent where
        processing relies on it. You may also unsubscribe from recurring
        contributions at any time by contacting the organization or by requesting
        cancellation through the platform.
      </p>

      <h2>9. Contact</h2>
      <p>
        For privacy questions or requests, contact us at{" "}
        <a className="underline" href="mailto:support@kivaro.app">
          support@kivaro.app
        </a>
        . If you believe your data has been mishandled, you may also lodge a
        complaint with the Data Protection Commission of Ghana.
      </p>
    </>
  );
}