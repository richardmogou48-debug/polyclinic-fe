import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import InvoicesSection from "@/components/dashboard/InvoicesSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Facturation" roleLabel={roleConfigs.secretary.label} />
      <main className="flex-1 px-8 py-6">
        <InvoicesSection portee="globale" />
      </main>
    </>
  );
}
