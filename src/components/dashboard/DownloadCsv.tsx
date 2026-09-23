"use client";

import { useState } from "react";
import { exportReportCsv, type ReportRange } from "@/app/actions/reports";

export function DownloadCsv({
  range = "all",
  label = "Export CSV",
  className,
}: {
  range?: ReportRange;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const result = await exportReportCsv(range);
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={handleDownload} disabled={busy} className={className} type="button">
      {busy ? "Preparing…" : label}
    </button>
  );
}