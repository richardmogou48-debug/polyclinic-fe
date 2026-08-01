import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MedicinesSection from "@/components/dashboard/MedicinesSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Catalogue médicaments" roleLabel={roleConfigs.pharmacist.label} />
      <main className="flex-1 px-8 py-6">
        <MedicinesSection />
      </main>
    </>
  );
}
