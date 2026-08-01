import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MedicinesWorkspace from "@/components/dashboard/MedicinesWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Pharmacie" roleLabel={roleConfigs.admin.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <MedicinesWorkspace />
      </main>
    </>
  );
}
