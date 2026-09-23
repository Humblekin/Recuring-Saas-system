import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-cream border-t border-border py-12 md:py-16">
      <div className="section-container">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink no-underline"
            aria-label="Kivaro home"
          >
            <span
              className="w-8 h-8 rounded-md bg-terracotta flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="font-display font-medium text-sm leading-none text-[#051009]">
                K
              </span>
            </span>
            <span
              className="text-xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              Kivaro
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-6 md:gap-8 text-sm font-medium">
            <a href="#product" className="text-ink-muted hover:text-ink transition-colors">Product</a>
            <a href="#how-it-works" className="text-ink-muted hover:text-ink transition-colors">How it works</a>
            <a href="#pricing" className="text-ink-muted hover:text-ink transition-colors">Pricing</a>
            <Link href="/register" className="text-ink-muted hover:text-ink transition-colors">Register</Link>
            <Link href="/login" className="text-ink-muted hover:text-ink transition-colors">Log in</Link>
          </div>

        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 border-t border-border text-xs text-ink-muted">
          <p>© {currentYear} Kivaro. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-ink transition-colors">Cookie Policy</Link>
            <Link href="/security" className="hover:text-ink transition-colors">Security</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
