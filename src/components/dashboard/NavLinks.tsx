"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import {
  DashboardIcon,
  LinkIcon,
  WalletIcon,
  RecurringIcon,
  MegaphoneIcon,
  ChartIcon,
  UsersIcon,
  SettingsIcon,
} from "@/components/ui/icons";

const links = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/dashboard/payment-links", label: "Payment Links", icon: LinkIcon },
  { href: "/dashboard/contributions", label: "Contributions", icon: WalletIcon },
  { href: "/dashboard/recurring", label: "Recurring", icon: RecurringIcon },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: MegaphoneIcon },
  { href: "/dashboard/reports", label: "Reports", icon: ChartIcon },
  { href: "/dashboard/team", label: "Team", icon: UsersIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

// The four most important destinations stay on the fixed bottom bar; everything
// else lives behind "More". Cramming 8 labels into a 360px bar made the labels
// overflow their columns and hurt tap targets — a bottom sheet fixes both.
const PRIMARY_HREFS = new Set([
  "/dashboard",
  "/dashboard/payment-links",
  "/dashboard/contributions",
  "/dashboard/recurring",
]);

function MoreIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function LogOutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function isActiveFor(linkHref: string, pathname: string) {
  return linkHref === "/dashboard"
    ? pathname === "/dashboard" || pathname === "/dashboard/onboarding"
    : pathname.startsWith(linkHref);
}

export function NavLinks({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the More sheet on outside tap/click.
  useEffect(() => {
    if (!moreOpen) return;
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  if (orientation === "vertical") {
    return (
      <nav className="flex-1 p-4 space-y-1" aria-label="Primary">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = isActiveFor(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-ink text-cream"
                  : "text-ink-muted hover:bg-border/30 hover:text-ink"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  const primaryLinks = links.filter((l) => PRIMARY_HREFS.has(l.href));
  const overflowLinks = links.filter((l) => !PRIMARY_HREFS.has(l.href));
  const isMoreActive = overflowLinks.some((l) => pathname.startsWith(l.href));

  return (
    <>
      {/* Dismissal backdrop — closes the sheet but stays under the nav bar */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 md:hidden"
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <nav className="relative z-40 flex items-center gap-1" aria-label="Primary">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActiveFor(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-medium flex-1 min-w-0 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span className="mt-0.5 max-w-full truncate leading-none">{link.label}</span>
            </Link>
          );
        })}

        {/* More → bottom sheet */}
        <div className="relative flex-1 min-w-0" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium py-2 rounded-lg transition-colors",
              isMoreActive ? "text-ink" : "text-ink-muted hover:text-ink"
            )}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreIcon size={18} />
            <span className="mt-0.5 leading-none">More</span>
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 rounded-2xl bg-surface border border-border shadow-elevated overflow-hidden z-50 pb-1"
            >
              <div className="px-4 pt-3 pb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted">
                More
              </div>
              <div className="divide-y divide-border/60">
                {overflowLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-ink text-cream"
                          : "text-ink-muted hover:bg-border/30 hover:text-ink"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon size={16} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Sign out — must exist on mobile (the sidebar with the desktop
                  sign-out is hidden below md), so it lives at the foot of the
                  More sheet. */}
              <div className="border-t border-border/60 mt-1">
                <SignOutButton
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                  icon={<LogOutIcon size={16} />}
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}