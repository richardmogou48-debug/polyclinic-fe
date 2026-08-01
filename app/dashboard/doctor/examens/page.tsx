import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PendingExamsWorkspace from "@/components/dashboard/PendingExamsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// Le medecin voit la meme file que l'infirmiere : il a demande ces examens et attend leurs
// resultats pour prescrire. Il peut aussi en rendre un, MedicalRecordAccessFilter l'y autorise.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Examens en attente" roleLabel={roleConfigs.doctor.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <PendingExamsWorkspace />
      </main>
    </>
  );
}
