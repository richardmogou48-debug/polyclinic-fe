import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ExamAppointmentsList from "@/components/dashboard/ExamAppointmentsList";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Rendez-vous" roleLabel={roleConfigs.imagerie.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <ExamAppointmentsList categorie="IMAGING" />
      </main>
    </>
  );
}
