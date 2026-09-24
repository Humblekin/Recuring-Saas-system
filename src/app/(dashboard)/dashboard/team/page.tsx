import { getTeamMembers } from "@/app/actions/team";
import { TeamClient } from "@/components/team/TeamClient";

export const metadata = { title: "Team — Kivaro" };

export default async function TeamPage() {
  const { members, currentUserId, role, inviteUrl } = await getTeamMembers();

  return (
    <div>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
            Team
          </h2>
          <p className="text-ink-muted mt-1">
            People who manage this organization. Owners can change roles and remove members. Invite teammates by sending them a secure invite link — they join automatically when they create their account.
          </p>
        </div>

        <TeamClient
          members={members.map((m) => ({
            id: m.id,
            email: m.email,
            name: m.name,
            role: m.role as "owner" | "admin",
            createdAt: m.createdAt,
          }))}
          currentUserId={currentUserId}
          currentRole={role}
          inviteUrl={inviteUrl}
        />
      </div>
    </div>
  );
}