import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StaffWorkspace from "@/components/dashboard/StaffWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Personnel" roleLabel={roleConfigs.admin.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <StaffWorkspace />
      </main>
    </>
  );
}
