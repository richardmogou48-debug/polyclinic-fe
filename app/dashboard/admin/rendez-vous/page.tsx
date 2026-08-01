import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import AppointmentsWorkspace from "@/components/dashboard/AppointmentsWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Rendez-vous" roleLabel={roleConfigs.admin.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <AppointmentsWorkspace />
      </main>
    </>
  );
}
