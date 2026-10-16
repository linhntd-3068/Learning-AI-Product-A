"use client";
import { createContext, useContext, type ReactNode } from "react";
import { Card } from "./ui-kit";

export type Me = { id: string; email: string; fullName: string; role: string; roleName: string; permissions: string[] };

const MeContext = createContext<Me | null>(null);

export const MeProvider = ({ me, children }: { me: Me; children: ReactNode }) => (
  <MeContext.Provider value={me}>{children}</MeContext.Provider>
);

export function useMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be used inside the signed-in app shell");
  return me;
}

export function useCan() {
  const me = useMe();
  return (...perms: string[]) => perms.some((p) => me.permissions.includes(p));
}

// Screen-level gate: the API refuses anyway, this just explains it instead of showing empty errors.
export function RequirePermission({ any, children }: { any: string[]; children: ReactNode }) {
  const can = useCan();
  if (can(...any)) return <>{children}</>;
  return (
    <Card>
      <p className="text-sm text-slate-600">Vai trò của bạn không được phép xem màn hình này.</p>
    </Card>
  );
}
