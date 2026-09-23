"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelRecurringSubscription } from "@/app/actions/subscriptions";
import { errorMessage } from "@/lib/utils";

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (!window.confirm("Cancel this recurring subscription? The supporter will not be charged again from your side.")) return;
    setBusy(true);
    setError("");
    try {
      await cancelRecurringSubscription(subscriptionId);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not cancel the subscription."));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleCancel}
        disabled={busy}
        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {busy ? "Cancelling…" : "Cancel recurring"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}