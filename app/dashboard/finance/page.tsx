import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.finance.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Revenus du mois"} value={"0 FCFA"} hint={"Facturation cumulée"} />
          <StatCard label={"Factures impayées"} value={"0"} hint={"En attente de règlement"} />
          <StatCard label={"Paiements du jour"} value={"0"} hint={"Encaissés aujourd'hui"} />
        </div>
      </main>
    </>
  );
}
