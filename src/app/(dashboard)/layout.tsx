import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/server";
import { NavLinks } from "@/components/dashboard/NavLinks";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { EmailVerificationNotice } from "@/components/dashboard/EmailVerificationNotice";
import { LogoMark } from "@/components/ui/icons";
import {
  getUnreadNotificationCount,
  getNotificationsFeed,
  markAllNotificationsRead,
} from "@/app/actions/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth().catch(() => redirect("/login"));
  confirmSession(session);

  const user = await db.query.users.findFirst({
    where: eq(users.neonAuthId, session.user.id),
  });

  // Users with no organization are sent through onboarding.
  if (!user || !user.organizationId) {
    redirect("/dashboard/onboarding");
  }

  const [unreadCount, feed] = await Promise.all([
    getUnreadNotificationCount().catch(() => 0),
    getNotificationsFeed().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-border flex-col flex-shrink-0 min-h-screen">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <a href="/dashboard" className="flex items-center gap-2 text-ink no-underline">
            <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center text-cream">
              <LogoMark size={18} />
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Cowrie
            </span>
          </a>
        </div>

        <NavLinks orientation="vertical" />

        <div className="p-4 border-t border-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-terracotta/10 text-terracotta rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0">
              {(user.name || session.user.name || "O").charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-sm font-medium text-ink truncate">
                {user.name || session.user.name || "You"}
              </div>
              <div className="text-xs text-ink-muted truncate">{user.email || session.user.email}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ===================== MAIN COLUMN ===================== */}
      <main className="flex-1 flex flex-col min-h-0 md:min-h-screen">
        {/* Top bar (all viewports) */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 sm:px-6 flex-shrink-0 gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center text-cream">
              <LogoMark size={15} />
            </div>
            <a href="/dashboard" className="text-lg tracking-tight text-ink no-underline" style={{ fontFamily: "var(--font-display)" }}>
              Cowrie
            </a>
          </div>

          <h1 className="hidden md:block text-lg font-medium">Dashboard</h1>

          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationsBell
              initialCount={unreadCount}
              initialItems={feed.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                readAt: n.readAt ? n.readAt.toISOString() : null,
                createdAt: n.createdAt.toISOString(),
                payload: (n.payload || {}) as Record<string, unknown>,
              }))}
              loadCount={getUnreadNotificationCount}
              loadItems={getNotificationsFeed}
              markRead={markAllNotificationsRead}
            />
            <div className="w-8 h-8 bg-terracotta/10 text-terracotta rounded-full flex items-center justify-center font-medium text-sm md:hidden">
              {(user.name || session.user.name || "O").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Email verification call to action */}
        {session.user.emailVerified === false && (
          <div className="px-4 sm:px-6 pt-4">
            <EmailVerificationNotice email={session.user.email} />
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </div>

        {/* Mobile bottom navigation */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
          <NavLinks orientation="horizontal" />
        </div>
      </main>
    </div>
  );
}

type SessionShape = Awaited<ReturnType<typeof requireAuth>>;

function confirmSession(session: SessionShape): asserts session is SessionShape {
  if (!session?.user) throw new Error("Invalid session");
}