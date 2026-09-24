import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Sign in — Kivaro",
  robots: { index: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lp min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cream text-ink">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-surface text-ink p-12 relative overflow-hidden border-r border-border">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-terracotta/15 blur-3xl animate-glow pointer-events-none"></div>
        <div
          className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-terracotta/10 blur-3xl animate-glow pointer-events-none"
          style={{ animationDelay: "-3s" }}
        ></div>

        {/* Background Photo */}
        <div className="absolute inset-0">
          <Image
            src="/images/landing/team-meeting.jpg"
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c0a] via-[#070c0a]/80 to-[#070c0a]/55"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
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
        </div>

        {/* Value proposition */}
        <div className="relative z-10 max-w-md">
          <span className="section-label mb-4 block">Payments + recurring</span>
          <h1 className="text-4xl leading-tight mb-6 text-ink">
            Give your organization a better way to collect.
          </h1>
          <p className="text-ink-muted text-lg leading-relaxed">
            Payment links, QR codes, recurring contributions, and a real-time
            dashboard — all in one place.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-ink-muted text-xs">
          © {new Date().getFullYear()} Kivaro
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-cream relative overflow-hidden">
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-terracotta/10 blur-3xl animate-glow pointer-events-none"
          style={{ animationDelay: "-2s" }}
        ></div>
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}