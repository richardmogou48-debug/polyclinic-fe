import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PendingExamsWorkspace from "@/components/dashboard/PendingExamsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// L'infirmiere saisit ce que rend le plateau technique : la polyclinique n'a pas de role de
// technicien de laboratoire. Chaque resultat rendu leve le verrou sur la prescription de
// medicaments de la consultation correspondante.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Examens à réaliser" roleLabel={roleConfigs.nurse.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <PendingExamsWorkspace />
      </main>
    </>
  );
}
