import { getRecurringSubscriptions } from "@/app/actions/payments";
import { getCurrentUserRole } from "@/lib/auth/org";
import { formatCurrencyFromMinor, formatFrequency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CancelSubscriptionButton } from "@/components/dashboard/CancelSubscriptionButton";
import { RecurringIcon } from "@/components/ui/icons";

export default async function RecurringPage() {
  const subscriptions = await getRecurringSubscriptions();
  const role = await getCurrentUserRole();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
          Recurring giving
        </h2>
        <p className="text-ink-muted mt-1">
          Ongoing subscriptions from your supporters. Recurring charges are authorized through MTN Mobile Money pre-approvals and are collected automatically on schedule.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<RecurringIcon size={20} />}
          title="No active recurring subscriptions"
          description="Enable recurring payments on a payment link and supporters can convert to monthly, weekly, or yearly giving automatically."
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-border bg-cream">
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Supporter</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Frequency</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Next charge</th>
                  <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-cream/50 transition-colors">
                    <td className="p-4 text-sm">
                      <div className="font-medium text-ink">{sub.supporter?.name || "Anonymous"}</div>
                      <div className="text-xs text-ink-muted">{sub.supporter?.email}</div>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrencyFromMinor(sub.amount, sub.currency || "GHS")}
                    </td>
                    <td className="p-4 text-sm text-ink-muted capitalize">
                      {formatFrequency(sub.interval)}
                    </td>
                    <td className="p-4 text-sm">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="p-4 text-sm text-ink-muted whitespace-nowrap">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      {role === "owner" ? (
                        <CancelSubscriptionButton subscriptionId={sub.id} />
                      ) : (
                        <span className="text-xs text-ink-muted">Owner only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}