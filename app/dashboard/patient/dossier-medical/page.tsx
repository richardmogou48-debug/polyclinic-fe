import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MedicalRecordSection from "@/components/dashboard/MedicalRecordSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mon dossier médical" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-8 py-6">
        {/* Sans patientId, la section lit le dossier du titulaire de la session. */}
        <MedicalRecordSection />
      </main>
    </>
  );
}
