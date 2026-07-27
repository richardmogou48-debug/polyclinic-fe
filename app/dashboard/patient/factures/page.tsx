import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mes factures" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Mes factures" description="Factures et paiements." />
      </main>
    </>
  );
}
