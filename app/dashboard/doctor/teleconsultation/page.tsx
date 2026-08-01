import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import TeleconsultationWorkspace from "@/components/dashboard/TeleconsultationWorkspace";
import { roleConfigs } from "@/lib/navigation";

// Le medecin ouvre le salon depuis un rendez-vous, puis conduit la seance : demarrer, terminer,
// annuler. Le patient, lui, garde l'ecran de lecture — il rejoint, il ne pilote pas.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Téléconsultation" roleLabel={roleConfigs.doctor.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <TeleconsultationWorkspace />
      </main>
    </>
  );
}
