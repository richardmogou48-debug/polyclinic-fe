import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import DoctorPatientsSection from "@/components/dashboard/DoctorPatientsSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Dossiers patients" roleLabel={roleConfigs.doctor.label} />
      <main className="flex-1 px-8 py-6">
        <DoctorPatientsSection />
      </main>
    </>
  );
}
