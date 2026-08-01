import ConsultationWorkspace from "@/components/dashboard/ConsultationWorkspace";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { roleConfigs } from "@/lib/navigation";

// Tout le parcours clinique sur un ecran : consultation, examens, ordonnance, hospitalisation.
// Les separer obligerait le medecin a retrouver a chaque etape la consultation qu'il vient
// d'ecrire, sans garantie qu'il retombe sur la bonne.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Consultations" roleLabel={roleConfigs.doctor.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <ConsultationWorkspace />
      </main>
    </>
  );
}
