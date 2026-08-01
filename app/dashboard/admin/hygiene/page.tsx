import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import FacilitiesSection from "@/components/dashboard/FacilitiesSection";
import { roleConfigs } from "@/lib/navigation";

// Le menu n'a qu'une entree « Hygiene » alors que le service tient deux registres. Les taches
// de nettoyage sont montrees ici : elles portent un etat « en retard », donc un manquement
// actionnable, quand le registre des dechets releve de la tracabilite reglementaire.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Hygiène — nettoyage" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <FacilitiesSection registre="nettoyage" />
      </main>
    </>
  );
}
