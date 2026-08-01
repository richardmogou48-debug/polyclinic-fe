import CurrentStaysSection from "@/components/dashboard/CurrentStaysSection";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Patients hospitalisés" roleLabel={roleConfigs.nurse.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <CurrentStaysSection />
      </main>
    </>
  );
}
