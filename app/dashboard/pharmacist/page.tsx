import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Vue d'ensemble" roleLabel={roleConfigs.pharmacist.label} />
      <main className="flex-1 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={"Prescriptions à délivrer"} value={"0"} hint={"En attente"} />
          <StatCard label={"Médicaments référencés"} value={"0"} hint={"Au catalogue"} />
          <StatCard label={"Stock faible"} value={"0"} hint={"Articles sous le seuil"} />
        </div>
      </main>
    </>
  );
}
