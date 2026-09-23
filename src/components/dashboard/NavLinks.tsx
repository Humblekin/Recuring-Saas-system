"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

export function NavLinks({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        orientation === "vertical" ? "flex-1 p-4 space-y-1" : "flex items-center gap-2"
      )}
      aria-label="Primary"
    >
      {links.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/dashboard/onboarding"
            : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              orientation === "vertical"
                ? "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                : "flex flex-col items-center justify-center gap-1 text-[10px] font-medium flex-1 transition-colors",
              isActive
                ? "bg-ink text-cream"
                : "text-ink-muted hover:bg-border/30 hover:text-ink"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={orientation === "horizontal" ? 18 : 18} />
            <span className={orientation === "vertical" ? "" : "mt-0.5"}>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}