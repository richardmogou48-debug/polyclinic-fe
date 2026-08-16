import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PendingExamsWorkspace from "@/components/dashboard/PendingExamsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// L'ecran de travail du laboratoire : la file des analyses de biologie qui n'ont pas rendu.
// Chaque resultat rendu leve le verrou sur la prescription de medicaments de la consultation.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Examens à réaliser" roleLabel={roleConfigs.labo.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <PendingExamsWorkspace categorie="BIOLOGY" />
      </main>
    </>
  );
}
