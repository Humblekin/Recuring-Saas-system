import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in — Cowrie",
  robots: { index: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-cream p-12 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/landing/team-meeting.jpg"
            alt=""
            fill
            sizes="50vw"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/60"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-cream no-underline">
            <div className="w-8 h-8 bg-cream/10 backdrop-blur rounded-md flex items-center justify-center border border-cream/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="12" cy="12" rx="5" ry="7" stroke="white" strokeWidth="1.5" fill="none" />
                <ellipse cx="12" cy="12" rx="2" ry="3.5" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Cowrie
            </span>
          </Link>
        </div>

        {/* Value proposition */}
        <div className="relative z-10 max-w-md">
          <h1
            className="text-4xl leading-tight mb-6 text-cream"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Give your organization a better way to collect.
          </h1>
          <p className="text-cream/60 text-lg leading-relaxed">
            Payment links, QR codes, recurring contributions, and a real-time
            dashboard — all in one place.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-cream/40 text-xs">
          © {new Date().getFullYear()} Cowrie Platform
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-cream">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
