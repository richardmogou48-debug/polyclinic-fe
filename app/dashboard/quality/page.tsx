import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.quality.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Plaintes ouvertes"} value={"0"} hint={"En cours de traitement"} />
          <StatCard label={"Incidents signalés"} value={"0"} hint={"Ce mois-ci"} />
          <StatCard label={"Audits planifiés"} value={"0"} hint={"À venir"} />
        </div>
      </main>
    </>
  );
}
