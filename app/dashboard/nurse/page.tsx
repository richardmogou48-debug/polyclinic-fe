import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.nurse.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Patients hospitalisés"} value={"0"} hint={"Sur l'ensemble des chambres"} />
          <StatCard label={"Lits disponibles"} value={"0"} hint={"Actuellement libres"} />
          <StatCard label={"Tâches en cours"} value={"0"} hint={"À réaliser aujourd'hui"} />
        </div>
      </main>
    </>
  );
}
