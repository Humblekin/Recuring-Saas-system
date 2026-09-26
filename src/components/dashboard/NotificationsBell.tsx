"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon, XIcon } from "@/components/ui/icons";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | string | null;
  createdAt: Date | string;
  payload?: unknown;
};

/**
 * Notifications bell. Reads the unread count / feed from server actions
 * (revalidated on interval + focus), marks all read on open.
 */
export function NotificationsBell({
  initialCount,
  initialItems,
  loadCount,
  loadItems,
  markRead,
  dismiss,
  clearAll,
}: {
  initialCount: number;
  initialItems: NotificationItem[];
  loadCount: () => Promise<number>;
  loadItems: () => Promise<NotificationItem[]>;
  markRead: () => Promise<unknown>;
  dismiss: (id: string) => Promise<unknown>;
  clearAll: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const [c, items] = await Promise.all([loadCount(), loadItems()]);
      setCount(c);
      setItems(items);
    } catch {
      // ignore refresh failures
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!open) refresh();
    }, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Hydrate after mount when the server rendered no initial data — keeps the
  // dashboard page render fast (no blocking DB round-trips in the layout).
  useEffect(() => {
    const t = setTimeout(() => {
      if (initialCount === 0 && initialItems.length === 0) refresh();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the DB fresh every open + mark as read
  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
      await markRead().catch(() => {});
      setCount(0);
      setLoading(false);
    }
  }

  // Dismiss one row, then resync the count. The row is removed optimistically
  // so the feed responds immediately, then reconciled against the server.
  async function dismissOne(id: string) {
    setBusyId(id);
    setError("");
    const previous = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await dismiss(id);
      await refresh();
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : "Could not dismiss that notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function clearFeed() {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) return;
    setClearing(true);
    setError("");
    const previous = items;
    setItems([]);
    try {
      await clearAll();
      setCount(0);
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : "Could not clear notifications.");
    } finally {
      setClearing(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        className="relative w-10 h-10 rounded-full border border-border bg-surface hover:bg-cream transition-colors flex items-center justify-center text-ink"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-cream text-[11px] font-semibold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Notifications</span>
            <div className="flex items-center gap-2">
              {loading && <span className="text-xs text-ink-muted">Loading…</span>}
              {items.length > 0 && (
                <button
                  onClick={clearFeed}
                  disabled={clearing}
                  className="text-xs text-ink-muted hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {clearing ? "Clearing…" : "Clear all"}
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}
          <div className="max-h-80 overflow-auto divide-y divide-border">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-muted">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => (
                <div key={n.id} className="px-4 py-3 flex items-start gap-2 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-ink">{n.title}</span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-ink-muted/70 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissOne(n.id)}
                    disabled={busyId === n.id}
                    className="w-6 h-6 flex-shrink-0 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors items-center justify-center disabled:opacity-50"
                    aria-label={`Dismiss ${n.title}`}
                    title="Dismiss"
                  >
                    {busyId === n.id ? (
                      <span className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                    ) : (
                      <XIcon size={13} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}