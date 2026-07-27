import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Paiements" roleLabel={roleConfigs.finance.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Paiements" description="Suivi des paiements reçus." />
      </main>
    </>
  );
}
