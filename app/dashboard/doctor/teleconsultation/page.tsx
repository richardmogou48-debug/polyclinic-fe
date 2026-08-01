import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import TeleconsultationSection from "@/components/dashboard/TeleconsultationSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Téléconsultation" roleLabel={roleConfigs.doctor.label} />
      <main className="flex-1 px-8 py-6">
        <TeleconsultationSection perspective="doctor" />
      </main>
    </>
  );
}
