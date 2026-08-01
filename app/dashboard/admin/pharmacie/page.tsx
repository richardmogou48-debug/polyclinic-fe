import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MedicinesSection from "@/components/dashboard/MedicinesSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Pharmacie" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <MedicinesSection />
      </main>
    </>
  );
}
