import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import EquipmentWorkspace from "@/components/dashboard/EquipmentWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Équipements" roleLabel={roleConfigs.admin.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <EquipmentWorkspace />
      </main>
    </>
  );
}
