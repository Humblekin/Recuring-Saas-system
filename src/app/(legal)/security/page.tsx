import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security",
};

export default function SecurityPage() {
  return (
    <>
      <h1>Security</h1>
      <p>Last updated: 23 September 2026.</p>
      <p>
        Kivaro handles financial contributions, so security is core to how we
        build. Here is what we do to protect supporters, organizations, and data.
      </p>

      <h2>1. Encrypted connections</h2>
      <p>
        All traffic to the platform is served over HTTPS with Strict Transport
        Security, and we have disabled embedding of the site in other origins
        (frame and cross-origin protections).
      </p>

      <h2>2. No card data, no PINs</h2>
      <p>
        We never collect or store MTN Mobile Money PINs. Payments are initiated
        and approved directly in the supporter&rsquo;s MTN MoMo app; we only handle
        the payment references needed to confirm settlement.
      </p>

      <h2>3. Authentication</h2>
      <p>
        Sign-in is handled through a managed session-based authentication service.
        Sessions are transmitted on secure cookies, and access to dashboards and
        APIs is scoped to the signed-in user and their organization.
      </p>

      <h2>4. Database protections</h2>
      <ul>
        <li>Every database query is parameterized to prevent SQL injection.</li>
        <li>Credentials are stored in environment secrets, never in code.</li>
        <li>Data is stored in a managed Postgres service with encryption at rest.</li>
      </ul>

      <h2>5. Application hardening</h2>
      <ul>
        <li>A Content Security Policy restricts what scripts and resources can load.</li>
        <li>User input is validated and output is escaped to prevent cross-site scripting (XSS).</li>
        <li>CSV exports neutralize spreadsheet formula injection.</li>
        <li>Server actions are protected by the platform&rsquo;s built-in CSRF controls.</li>
      </ul>

      <h2>6. Limited access</h2>
      <p>
        Production secrets are limited to the people who operate the platform.
        Monitoring and error logging include no payment or authentication secrets.
      </p>

      <h2>7. Reporting a vulnerability</h2>
      <p>
        Found a security issue? Please contact us at{" "}
        <a className="underline" href="mailto:security@kivaro.app">
          security@kivaro.app
        </a>{" "}
        and do not disclose the issue publicly until it has been resolved. We thank
        responsible researchers.
      </p>
    </>
  );
}