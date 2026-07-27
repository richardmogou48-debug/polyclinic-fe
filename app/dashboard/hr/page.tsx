import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.hr.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Effectif total"} value={"0"} hint={"Personnel actif"} />
          <StatCard label={"Postes ouverts"} value={"0"} hint={"En recrutement"} />
          <StatCard label={"Nouvelles demandes"} value={"0"} hint={"À traiter"} />
        </div>
      </main>
    </>
  );
}
