import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PatientsWorkspace from "@/components/dashboard/PatientsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// Le formulaire precede la liste : a l'accueil, inscrire est l'action, consulter est la
// verification qui suit. L'ordre inverse obligerait a faire defiler pour agir.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Patients" roleLabel={roleConfigs.secretary.label} />
      <main className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-8">
        <PatientsWorkspace />
      </main>
    </>
  );
}
