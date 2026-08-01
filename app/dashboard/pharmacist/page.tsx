import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import OverviewSection from "@/components/dashboard/OverviewSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.pharmacist.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <OverviewSection role="pharmacist" />
      </main>
    </>
  );
}
