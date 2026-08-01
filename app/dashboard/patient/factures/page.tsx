import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import InvoicesSection from "@/components/dashboard/InvoicesSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mes factures" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        {/* Portee « propre » : la route par patient, seule ouverte au role PATIENT. */}
        <InvoicesSection portee="propre" />
      </main>
    </>
  );
}
