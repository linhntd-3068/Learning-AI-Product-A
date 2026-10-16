import "server-only";
import type { GuardContext } from "./route-guard";

// Append one audit entry (who, what, before / after, reason). Never blocks the business action:
// a failed audit write is logged on the server and the request still succeeds.
export async function writeAuditLog(
  { user, db }: GuardContext,
  entry: { action: string; entity: string; entityId: string | number; before?: unknown; after?: unknown; reason?: string },
) {
  const { error } = await db.from("audit_logs").insert({
    actor: user.id,
    actor_email: user.email,
    action: entry.action,
    entity: entry.entity,
    entity_id: String(entry.entityId),
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
  });
  if (error) console.error("audit log failed", error.message);
}
