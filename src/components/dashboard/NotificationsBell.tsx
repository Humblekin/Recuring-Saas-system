"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/ui/icons";

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
}: {
  initialCount: number;
  initialItems: NotificationItem[];
  loadCount: () => Promise<number>;
  loadItems: () => Promise<NotificationItem[]>;
  markRead: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
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
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            {loading && <span className="text-xs text-ink-muted">Loading…</span>}
          </div>
          <div className="max-h-80 overflow-auto divide-y divide-border">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-muted">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-ink-muted/70 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}