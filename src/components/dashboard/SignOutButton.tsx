"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { LogoMark } from "@/components/ui/icons";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={
        compact
          ? "text-xs text-ink-muted hover:text-ink transition-colors font-medium"
          : "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink-muted hover:bg-border/30 hover:text-ink transition-colors"
      }
    >
      <LogoMark size={18} />
      <span className={compact ? "" : ""}>{loading ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}