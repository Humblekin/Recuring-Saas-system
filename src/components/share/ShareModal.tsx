"use client";

import { QRCodeSVG } from "qrcode.react";
import { CopyButton } from "@/components/ui/CopyButton";
import { XIcon } from "@/components/ui/icons";

/**
 * Share dialog for a payment link: shows the public URL, a copy button and a
 * downloadable QR code. Rendered in a modal so it works anywhere in the app.
 */
export function ShareModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${title}`}
    >
      <div
        className="bg-surface border border-border rounded-3xl p-8 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>
              Share this link
            </h3>
            <p className="text-sm text-ink-muted mt-0.5">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-2xl border border-border">
            <QRCodeSVG value={url} size={168} marginSize={0} />
          </div>
        </div>

        <div className="flex items-stretch gap-3 mb-2">
          <code className="flex-1 min-w-0 flex items-center px-3 py-2 rounded-xl bg-cream border border-border text-xs text-ink-muted truncate">
            {url}
          </code>
          <CopyButton
            text={url}
            label="Copy"
            className="px-4 rounded-xl border border-border hover:bg-cream transition-colors justify-center"
          />
        </div>

        <p className="text-xs text-ink-muted">
          Supporters with this link can give one-time or recurring amounts via mobile
          money, card, or bank transfer.
        </p>
      </div>
    </div>
  );
}