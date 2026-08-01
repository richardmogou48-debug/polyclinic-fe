import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import AuditsWorkspace from "@/components/dashboard/AuditsWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Audits" roleLabel={roleConfigs.quality.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <AuditsWorkspace />
      </main>
    </>
  );
}
