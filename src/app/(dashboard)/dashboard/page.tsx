import { getOverviewData } from "@/app/actions/payments";
import { formatCurrencyFromMinor } from "@/lib/utils";
import Link from "next/link";
import {
  WalletIcon,
  RecurringIcon,
  UsersIcon,
  PlusIcon,
  LinkIcon,
  MegaphoneIcon,
} from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DashboardOverview() {
  const stats = await getOverviewData();

  const cards = [
    {
      label: "Total collected",
      value: formatCurrencyFromMinor(stats.totalCollected, "GHS"),
      icon: WalletIcon,
    },
    {
      label: "This month",
      value: formatCurrencyFromMinor(stats.thisMonthCollected, "GHS"),
      icon: RecurringIcon,
    },
    {
      label: "Active recurring",
      value: String(stats.activeSubscribers),
      icon: RecurringIcon,
    },
    {
      label: "Supporters",
      value: String(stats.supporters),
      icon: UsersIcon,
    },
  ];

  const maxValue = Math.max(...stats.chart.values, 1);

  return (
    <div className="flex flex-col gap-8">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/payment-links/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon size={16} />
          New payment link
        </Link>
        <Link href="/dashboard/campaigns/new" className="px-5 py-3 rounded-xl border border-border text-ink hover:bg-surface transition-colors font-medium text-sm inline-flex items-center gap-2">
          <MegaphoneIcon size={16} />
          Start a campaign
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-surface border border-border p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-ink-muted">{card.label}</span>
                <span className="w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center text-ink-muted">
                  <Icon size={15} />
                </span>
              </div>
              <div className="text-2xl font-display font-medium text-ink">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* 6-month chart */}
      <div className="bg-surface border border-border p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Last 6 months</h2>
          <Link href="/dashboard/reports" className="text-terracotta text-sm font-medium hover:underline">
            View reports →
          </Link>
        </div>
        <div className="flex items-end gap-3 h-40">
          {stats.chart.labels.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-ink-muted font-medium">
                {stats.chart.values[i] >= 100 ? `GHS ${Math.round(stats.chart.values[i])}` : stats.chart.values[i] > 0 ? `GHS ${stats.chart.values[i]}` : "—"}
              </span>
              <div
                className="w-full rounded-t-lg bg-ink/10"
                style={{
                  height: `${Math.max(4, (stats.chart.values[i] / maxValue) * 100)}%`,
                  backgroundColor: i === stats.chart.labels.length - 1 ? "#1A1A1A" : undefined,
                }}
              />
              <span className="text-[11px] text-ink-muted">
                {new Date(`${label}-01`).toLocaleDateString(undefined, { month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent contributions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent contributions</h2>
          <Link href="/dashboard/contributions" className="text-terracotta text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        {stats.recentContributions.length === 0 ? (
          <EmptyState
            icon={<LinkIcon size={20} />}
            title="No contributions yet"
            description="Create a payment link and share it to start collecting your first contributions."
            action={
              <Link href="/dashboard/payment-links/new" className="btn-primary inline-flex items-center gap-2">
                <PlusIcon size={16} />
                Create payment link
              </Link>
            }
          />
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-border bg-cream">
                    <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Supporter</th>
                    <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Reason</th>
                    <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                    <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Type</th>
                    <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentContributions.map((payment) => (
                    <tr key={payment.id} className="hover:bg-cream/50 transition-colors">
                      <td className="p-4 text-sm">
                        <div className="font-medium text-ink">{payment.supporter?.name || "Anonymous"}</div>
                        <div className="text-xs text-ink-muted">{payment.supporter?.email}</div>
                      </td>
                      <td className="p-4 text-sm text-ink-muted">
                        {payment.campaign?.title || payment.paymentLink?.name || "General"}
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {formatCurrencyFromMinor(payment.amount, payment.currency || "GHS")}
                      </td>
                      <td className="p-4 text-sm text-ink-muted">
                        {payment.isRecurring ? "Recurring" : "One-time"}
                      </td>
                      <td className="p-4 text-sm">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="p-4 text-sm text-ink-muted whitespace-nowrap">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}