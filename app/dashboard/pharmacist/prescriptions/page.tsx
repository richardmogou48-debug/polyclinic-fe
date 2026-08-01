import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PrescriptionsSection from "@/components/dashboard/PrescriptionsSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Prescriptions" roleLabel={roleConfigs.pharmacist.label} />
      <main className="flex-1 px-8 py-6">
        <PrescriptionsSection portee="etablissement" />
      </main>
    </>
  );
}
