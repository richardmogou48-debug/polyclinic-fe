import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import OverviewSection from "@/components/dashboard/OverviewSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-8 py-6">
        <OverviewSection role="patient" />
      </main>
    </>
  );
}
