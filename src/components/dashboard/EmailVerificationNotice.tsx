"use client";

import { useState } from "react";
import { sendVerificationEmail } from "@/lib/auth/client";
import { XIcon } from "@/components/ui/icons";

/**
 * Shows when the signed-in user hasn't verified their email address yet.
 * Email delivery is configured on the Neon Auth console; if it's not
 * configured the action fails gracefully and we hint at setup.
 */
export function EmailVerificationNotice({
  email,
}: {
  email: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (hidden) return null;

  async function resend() {
    setSending(true);
    setError("");
    try {
      const result = await sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        setError(
          "Could not send the verification email. Ask your administrator to enable verification emails in the Neon Auth console."
        );
      } else {
        setDone(true);
      }
    } catch {
      setError("Could not send the verification email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-4">
      <div>
        <p className="font-medium mb-0.5">Verify your email address</p>
        <p className="text-yellow-700">
          {done
            ? "Verification email sent. Check your inbox."
            : "A verification email has been sent. It is required to secure your account."}
          {error && <span className="block text-yellow-700 mt-1">{error}</span>}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {!done && (
          <button
            onClick={resend}
            disabled={sending}
            className="font-medium hover:underline disabled:opacity-50"
          >
            {sending ? "Sending…" : "Resend"}
          </button>
        )}
        <button onClick={() => setHidden(true)} aria-label="Dismiss" className="hover:opacity-70">
          <XIcon size={16} />
        </button>
      </div>
    </div>
  );
}