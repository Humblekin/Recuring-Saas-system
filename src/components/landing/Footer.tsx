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
            className="flex items-center gap-2 text-ink no-underline"
            aria-label="Cowrie home"
          >
            <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                  fill="white"
                />
                <ellipse cx="12" cy="12" rx="5" ry="7" stroke="white" strokeWidth="1.5" fill="none" />
                <ellipse cx="12" cy="12" rx="2" ry="3.5" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span
              className="text-xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Cowrie
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
          <p>© {currentYear} Cowrie Platform. All rights reserved.</p>
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
