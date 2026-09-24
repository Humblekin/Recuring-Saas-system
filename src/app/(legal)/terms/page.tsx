import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>Last updated: 23 September 2026.</p>

      <h2>1. About these terms</h2>
      <p>
        These Terms of Service govern your use of the Kivaro platform. By creating
        an account, accepting a contribution, or making a contribution, you agree
        to these terms. If you do not agree, please do not use the platform.
      </p>

      <h2>2. The platform</h2>
      <p>
        Kivaro lets organizations publish payment links and campaigns and collect
        one-time or recurring contributions from supporters through MTN Mobile
        Money (MTN MoMo). Kivaro is a technology provider and is not a party to the
        relationship between an organization and its supporters.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You are responsible for safeguarding your account credentials and for all
        activity performed through your account. You must provide accurate
        information and keep it up to date. We may suspend accounts that are used
        in breach of these terms.
      </p>

      <h2>4. Contributions and refunds</h2>
      <h3>4.1 Supporter contributions</h3>
      <p>
        When you make a contribution, the payment is initiated through MTN MoMo
        and approved by you on your phone. A contribution to a campaign or
        organization is a gift; refunds are at the discretion of the organization,
        subject to applicable consumer protection law.
      </p>
      <h3>4.2 Recurring contributions</h3>
      <p>
        Recurring contributions are billed automatically on the schedule you
        select until you cancel. You may cancel a recurring contribution at any
        time before the next billing date. Unauthorized or declined debits are
        handled by MTN under its own terms.
      </p>

      <h2>5. Organization responsibilities</h2>
      <p>
        Organizations using Kivaro agree to:
      </p>
      <ul>
        <li>Use the platform only for lawful fundraising and charitable purposes.</li>
        <li>Not misrepresent what contributions will fund.</li>
        <li>Not use the platform to receive funds for unlawful activity, gambling, personal enrichment fraud, or prohibited goods.</li>
        <li>Comply with all applicable laws, including money-laundering and charitable registration rules in Ghana.</li>
        <li>Use contributions in line with what supporters were told.</li>
      </ul>
      <p>
        We may suspend or close accounts that we reasonably believe are used for
        prohibited activity.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You may not use Kivaro to:</p>
      <ul>
        <li>Violate any law or regulation.</li>
        <li>Attempt to gain unauthorized access to accounts, systems, or data.</li>
        <li>Distribute malicious code, spam, or deceptive content.</li>
        <li>Harass, defraud, or impersonate any person or entity.</li>
        <li>Interfere with the operation of the platform.</li>
      </ul>

      <h2>7. Fees</h2>
      <p>
        Kivaro does not currently charge organizations a platform fee for
        contributions. MTN Mobile Money transaction charges, if any, are applied
        by MTN and are separate from Kivaro.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Kivaro name, logo, and platform are owned by Kivaro. Organizations
        retain ownership of their content, campaigns, and supporter relationships.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The platform is provided &ldquo;as is&rdquo; without warranties of any
        kind, whether express or implied. To the fullest extent permitted by law,
        Kivaro is not liable for indirect, incidental, or consequential damages,
        or for the acts, omissions, or insolvency of any organization or of MTN.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the platform at any time. We may suspend or terminate
        access where we believe these terms have been breached or where continued
        operation involves legal or financial risk.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms from time to time. Material changes will be
        communicated through the platform. Continued use after changes takes
        effect constitutes acceptance.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Ghana. Any
        disputes are subject to the exclusive jurisdiction of the courts of Ghana.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a className="underline" href="mailto:support@kivaro.app">
          support@kivaro.app
        </a>
        .
      </p>
    </>
  );
}