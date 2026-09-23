import { db } from "@/lib/db";
import { payments, organizations, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrencyFromMinor } from "@/lib/utils";
import { getMomoStatus } from "@/app/actions/checkout";

// =============================================================================
// PUBLIC GIVING CALLBACK — receipt/trust anchor for an MTN MoMo payment.
// Verifies the transaction directly with MTN (server-side truth), then records
// the result against the payment created at checkout. The webhook remains the
// authoritative path for *all* events (including recurring charges); this page
// simply closes the loop for the supporter.
// =============================================================================

export const dynamic = "force-dynamic";

type CallbackView = {
  status: "pending" | "success" | "error";
  title: string;
  message: string;
};

export default async function GiveCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ kind?: string; referenceId?: string }>;
}) {
  const { orgSlug } = await params;
  const { kind, referenceId } = await searchParams;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });
  if (!org) notFound();

  if (!referenceId) {
    return (
      <StatusCard
        status="error"
        title="Payment error"
        message="No transaction reference was provided."
        accent={org.primaryColor || "#1A1A1A"}
      />
    );
  }

  const isRecurring = kind === "recurring";

  let amountMinor: number | null = null;
  let view: CallbackView;
  try {
    const result = await getMomoStatus({ kind: isRecurring ? "recurring" : "one-time", referenceId });

    if (isRecurring) {
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.mtnPreApprovalId, referenceId),
      });
      amountMinor = sub?.amount ?? null;
    } else {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.mtnTransactionId, referenceId),
      });
      amountMinor = payment?.amount ?? null;
    }

    if (result.status === "success") {
      view = {
        status: "success",
        title: "Thank you!",
        message: `Your payment of ${
          amountMinor != null ? formatCurrencyFromMinor(amountMinor, "GHS") : "your contribution"
        } to ${org.name} has been received.`,
      };
    } else if (result.status === "pending") {
      view = {
        status: "pending",
        title: "Awaiting approval",
        message: "Approve the payment request in your MTN MoMo app. This page will refresh automatically.",
      };
    } else {
      view = {
        status: "error",
        title: "Payment not completed",
        message: result.reason || "Your payment could not be processed. Please try again.",
      };
    }
  } catch (err) {
    console.error("Give callback verification error:", err);
    view = {
      status: "error",
      title: "Verification error",
      message: "We could not verify your transaction status. If money was deducted, contact the organization.",
    };
  }

  return (
    <StatusCard
      {...view}
      accent={org.primaryColor || "#1A1A1A"}
    />
  );
}

function StatusCard({
  status,
  title,
  message,
  accent,
}: {
  status: "pending" | "success" | "error";
  title: string;
  message: string;
  accent: string;
}) {
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-cream border border-border p-8 rounded-3xl text-center shadow-sm">
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
            isSuccess ? "bg-green-100 text-green-600" : status === "pending" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : status === "pending" ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        <p className="text-ink-muted mb-8">{message}</p>

        <Link
          href="/"
          className="block w-full py-3 rounded-xl text-cream font-medium no-underline"
          style={{ backgroundColor: accent }}
        >
          Done
        </Link>
      </div>
    </div>
  );
}