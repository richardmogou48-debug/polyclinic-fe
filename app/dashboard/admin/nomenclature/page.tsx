import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ExamCatalogSection from "@/components/dashboard/ExamCatalogSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Nomenclature des examens" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <ExamCatalogSection />
      </main>
    </>
  );
}
