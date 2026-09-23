import { getReportSummary, getSubscriptionReport } from "@/app/actions/reports";
import { DownloadCsv } from "@/components/dashboard/DownloadCsv";
import { formatCurrencyFromMinor } from "@/lib/utils";

export const metadata = { title: "Reports — Cowrie" };

export default async function ReportsPage() {
  const [summary, subs] = await Promise.all([
    getReportSummary("all"),
    getSubscriptionReport(),
  ]);

  const stats = [
    { label: "Total collected (all time)", value: formatCurrencyFromMinor(summary.totalCollected, "GHS") },
    { label: "From recurring", value: formatCurrencyFromMinor(summary.recurringCollected, "GHS") },
    { label: "From one-time", value: formatCurrencyFromMinor(summary.oneTimeCollected, "GHS") },
    { label: "Unique contributors", value: String(summary.contributors) },
    { label: "Active subscriptions", value: String(subs.count) },
    {
      label: "Expected monthly recurring",
      value: formatCurrencyFromMinor(subs.expectedMonthly, "GHS"),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
            Reports
          </h2>
          <p className="text-ink-muted mt-1">Pulled live from your data. Export everything to CSV for your records.</p>
        </div>
        <DownloadCsv
          className="px-5 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm"
          label="Export all to CSV"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface border border-border p-5 rounded-2xl">
            <div className="text-sm text-ink-muted mb-1">{stat.label}</div>
            <div className="text-2xl font-medium">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border p-6 rounded-2xl">
        <h3 className="text-lg font-medium mb-4">Collected by source</h3>
        {summary.byLink.length === 0 ? (
          <p className="text-sm text-ink-muted">No successful payments recorded yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Source</th>
                <th className="py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Payments</th>
                <th className="py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.byLink.map((row) => (
                <tr key={row.name}>
                  <td className="py-3 text-sm">{row.name}</td>
                  <td className="py-3 text-sm text-ink-muted">{row.count}</td>
                  <td className="py-3 text-sm font-medium">{formatCurrencyFromMinor(row.total, "GHS")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}