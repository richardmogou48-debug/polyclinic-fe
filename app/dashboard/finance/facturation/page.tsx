import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import InvoicesSection from "@/components/dashboard/InvoicesSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Facturation" roleLabel={roleConfigs.finance.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <InvoicesSection portee="globale" />
      </main>
    </>
  );
}
