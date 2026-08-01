import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MedicinesWorkspace from "@/components/dashboard/MedicinesWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Catalogue" roleLabel={roleConfigs.pharmacist.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <MedicinesWorkspace />
      </main>
    </>
  );
}
