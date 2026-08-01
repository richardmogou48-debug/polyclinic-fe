import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import IncidentsWorkspace from "@/components/dashboard/IncidentsWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Incidents" roleLabel={roleConfigs.quality.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <IncidentsWorkspace />
      </main>
    </>
  );
}
