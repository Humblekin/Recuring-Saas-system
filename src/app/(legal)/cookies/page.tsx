import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p>Last updated: 23 September 2026.</p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored by your browser. They help sites work
        correctly, remember your session, and understand how the site is used.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li>
          <strong>Essential session cookie</strong> — required for you to sign in
          and use your dashboard. Without it, logging in and managing your
          organization or contributions would not work.
        </li>
        <li>
          <strong>Functional preferences</strong> — used to remember simple,
          non-identifying UI choices (for example, which prompts you dismissed).
        </li>
      </ul>
      <p>
        We do not use advertising or cross-site tracking cookies.
      </p>

      <h2>3. Third-party services</h2>
      <p>
        Our sign-in (authentication) service may set a small security cookie to
        keep your session valid. This cookie is strictly necessary and does not
        follow you across other websites.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can delete or block cookies in your browser settings. Blocking
        strictly essential cookies will prevent you from signing in to the
        platform; the rest of the site remains usable.
      </p>

      <h2>5. Contact</h2>
      <p>
        Questions about this policy:{" "}
        <a className="underline" href="mailto:support@cowrie.app">
          support@cowrie.app
        </a>
        .
      </p>
    </>
  );
}