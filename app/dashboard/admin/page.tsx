import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Utilisateurs actifs"} value={"0"} hint={"Tous rôles confondus"} />
          <StatCard label={"Services en ligne"} value={"13"} hint={"Microservices de la plateforme"} />
          <StatCard label={"Alertes système"} value={"0"} hint={"Aucune alerte active"} />
        </div>
      </main>
    </>
  );
}
