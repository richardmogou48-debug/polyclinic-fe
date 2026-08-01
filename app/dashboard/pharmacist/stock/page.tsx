import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StockSection from "@/components/dashboard/StockSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Stock" roleLabel={roleConfigs.pharmacist.label} />
      <main className="flex-1 px-8 py-6">
        <StockSection />
      </main>
    </>
  );
}
