import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import QualitySection from "@/components/dashboard/QualitySection";
import { roleConfigs } from "@/lib/navigation";

// Le menu administrateur n'a qu'une entree « Qualite » la ou le service qualite en a trois.
// On y montre les incidents : c'est le registre qui appelle une decision de direction, quand
// plaintes et audits relevent du suivi courant du service.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Qualité — incidents" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <QualitySection registre="incident" />
      </main>
    </>
  );
}
