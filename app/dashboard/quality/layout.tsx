import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { roleConfigs } from "@/lib/navigation";

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardShell config={roleConfigs.quality}>{children}</DashboardShell>;
}
