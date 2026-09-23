"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole, removeMember } from "@/app/actions/team";
import { CopyButton } from "@/components/ui/CopyButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { errorMessage } from "@/lib/utils";

type MemberRow = {
  id: string;
  email: string;
  name: string | null;
  role: "owner" | "admin";
  createdAt: string | Date;
};

export function TeamClient({
  members,
  currentUserId,
  currentRole,
  inviteUrl,
}: {
  members: MemberRow[];
  currentUserId: string;
  currentRole: "owner" | "admin";
  inviteUrl: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwner = currentRole === "owner";

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError("");
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {isOwner && (
        <div className="bg-surface border border-border p-5 rounded-2xl">
          <h3 className="font-medium mb-2">Invite teammates</h3>
          <p className="text-sm text-ink-muted mb-4">
            Share this secure invite link. New accounts that sign up with it join
            automatically as admins. The link is secret — only give it to people
            you want on your team.
          </p>
          <div className="flex items-center gap-3">
            <code className="text-xs text-ink-muted bg-cream border border-border px-3 py-2 rounded-lg truncate flex-1 min-w-0">
              {inviteUrl}
            </code>
            <CopyButton text={inviteUrl} label="URL" />
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-cream">
              <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Member</th>
              <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider">Joined</th>
              {isOwner && <th className="p-4 text-xs font-medium text-ink-muted uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              return (
                <tr key={member.id} className="hover:bg-cream/50 transition-colors">
                  <td className="p-4 text-sm">
                    <div className="font-medium text-ink">
                      {member.name || "—"}
                      {isSelf && <span className="text-xs text-ink-muted ml-2">(you)</span>}
                    </div>
                    <div className="text-xs text-ink-muted">{member.email}</div>
                  </td>
                  <td className="p-4 text-sm">
                    <StatusBadge status={member.role === "owner" ? "active" : "admin"} />
                  </td>
                  <td className="p-4 text-sm text-ink-muted whitespace-nowrap">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td className="p-4 text-right">
                      {!isSelf && member.role !== "owner" && (
                        <div className="flex items-center justify-end gap-3">
                          <select
                            defaultValue={member.role}
                            onChange={(e) => run(member.id, () => setMemberRole(member.id, e.target.value as "owner" | "admin"))}
                            disabled={busyId === member.id}
                            className="px-2 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium disabled:opacity-50"
                          >
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${member.email} from the team?`)) {
                                run(member.id, () => removeMember(member.id));
                              }
                            }}
                            disabled={busyId === member.id}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}