import type { ReactNode } from "react";
import type { RoleConfig } from "@/lib/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardShell({
  config,
  children,
}: {
  config: RoleConfig;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar config={config} />
      <div className="flex flex-1 flex-col bg-neutral-50">{children}</div>
    </div>
  );
}
