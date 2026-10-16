import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

// Every screen behind login shares the shell (menu by role, signed-in user, logout).
export default function SignedInLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
