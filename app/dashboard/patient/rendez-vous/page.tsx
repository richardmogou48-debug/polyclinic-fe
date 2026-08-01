import AppointmentsSection from "@/components/dashboard/AppointmentsSection";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mes rendez-vous" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <AppointmentsSection perspective="patient" />
      </main>
    </>
  );
}
