"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
        copied ? "text-green-600" : "text-terracotta hover:text-terracotta/80",
        className
      )}
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? "Copied" : label}
    </button>
  );
}