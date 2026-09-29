import Link from "next/link";

// =============================================================================
// FOOTER — Mobile-first. On small screens the nav becomes a balanced 2×2 grid
// (Product / Account / Legal / signup card), and the bottom bar stacks with a
// safe-area inset for iOS. On `lg` the same grid becomes 4 even columns.
// =============================================================================

const PRODUCT_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get Started", href: "/register" },
];

const ACCOUNT_LINKS = [
  { label: "Sign In", href: "/login" },
  { label: "Create Account", href: "/register" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Recurring Payments", href: "/dashboard/recurring" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Security", href: "/security" },
];

function MomoBolt({ className = "text-gold", size = 12 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function UpArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-cream-dark border-t border-border">
      {/* Hairline accent — a soft terracotta seam between the CTA and the footer */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-terracotta/50 to-transparent"
        aria-hidden="true"
      />

      <div className="section-container pt-12 pb-12 md:pt-16 md:pb-14">
        {/* ===================== Top: brand + trust ===================== */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between mb-12 md:mb-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-ink no-underline"
              aria-label="Kivaro home"
            >
              <span
                className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center shrink-0 shadow-sm"
                aria-hidden="true"
              >
                <span className="font-display font-medium text-base leading-none text-[#051009]">
                  K
                </span>
              </span>
              <span
                className="text-2xl tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
              >
                Kivaro
              </span>
            </Link>

            <p className="mt-4 text-body-sm text-balance">
              Recurring payments, made simple — for churches, NGOs, schools and
              communities across Ghana.
            </p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[11px] font-mono uppercase tracking-[0.12em] text-ink-muted">
              <MomoBolt className="text-gold" size={11} />
              Powered by MTN Mobile Money
            </span>
          </div>

          {/* ===================== Link grid =====================
              Mobile: 2×2. Legal spans both columns and shows its 4 links in
              a 2-col inner grid. CTA card spans both columns.
              lg: 4 even columns. */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-x-12 w-full md:w-auto">
            {/* Product */}
            <div className="min-w-0">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted mb-4">
                Product
              </h4>
              <ul className="flex flex-col gap-3">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-light hover:text-ink transition-colors no-underline leading-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div className="min-w-0">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted mb-4">
                Account
              </h4>
              <ul className="flex flex-col gap-3">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-light hover:text-ink transition-colors no-underline leading-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal — spans full width on mobile */}
            <div className="min-w-0 col-span-2 lg:col-span-1">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted mb-4">
                Legal
              </h4>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-3 lg:flex lg:flex-col">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-light hover:text-ink transition-colors no-underline leading-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA card — spans full width on mobile */}
            <div className="min-w-0 col-span-2 lg:col-span-1">
              <div className="h-full p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between gap-4">
                <p className="text-[15px] font-medium text-ink leading-snug">
                  Ready to start collecting?
                </p>
                <p className="text-[13px] text-ink-muted leading-relaxed">
                  Create your free account and get your payment link in minutes.
                </p>
                <Link
                  href="/register"
                  className="btn-primary w-full text-center !px-4 !py-3 text-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== Bottom bar ===================== */}
        <div
          className="border-t border-border pt-6 md:pt-7 flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
          style={{ paddingBottom: "max(0rem, env(safe-area-inset-bottom))" }}
        >
          <p className="text-xs text-ink-muted text-center md:text-left">
            © {currentYear} Kivaro. All rights reserved.
          </p>

          <div className="flex items-center justify-center gap-x-6 gap-y-3 flex-wrap">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-ink-muted">
              <MomoBolt className="text-gold" size={10} />
              MTN Mobile Money · GHS
            </span>

            <a
              href="#main-nav"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-light hover:text-ink transition-colors no-underline"
            >
              Back to top
              <UpArrow />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}