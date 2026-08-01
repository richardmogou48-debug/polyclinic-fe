import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PatientsWorkspace from "@/components/dashboard/PatientsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// L'infirmiere tient l'accueil : c'est elle qui enregistre le patient et prend ses parametres.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Accueil" roleLabel={roleConfigs.nurse.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <PatientsWorkspace />
      </main>
    </>
  );
}
