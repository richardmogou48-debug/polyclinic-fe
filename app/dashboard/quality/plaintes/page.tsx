import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ComplaintsWorkspace from "@/components/dashboard/ComplaintsWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Réclamations" roleLabel={roleConfigs.quality.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <ComplaintsWorkspace />
      </main>
    </>
  );
}
