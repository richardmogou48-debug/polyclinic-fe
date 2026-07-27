import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Prochain rendez-vous"} value={"—"} hint={"Aucun rendez-vous programmé"} />
          <StatCard label={"Dossier médical"} value={"À jour"} hint={"Dernière mise à jour récente"} />
          <StatCard label={"Factures en attente"} value={"0"} hint={"Aucun solde impayé"} />
        </div>
      </main>
    </>
  );
}
