import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.secretary.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Rendez-vous aujourd'hui"} value={"0"} hint={"Tous médecins confondus"} />
          <StatCard label={"Patients enregistrés"} value={"0"} hint={"Au total"} />
          <StatCard label={"Factures en attente"} value={"0"} hint={"À traiter"} />
        </div>
      </main>
    </>
  );
}
