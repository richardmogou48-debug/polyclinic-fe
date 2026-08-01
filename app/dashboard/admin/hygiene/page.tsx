import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import CleaningWorkspace from "@/components/dashboard/CleaningWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Hygiène" roleLabel={roleConfigs.admin.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <CleaningWorkspace />
      </main>
    </>
  );
}
