import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mes rendez-vous" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Mes rendez-vous" description="Consultez et gérez vos rendez-vous." />
      </main>
    </>
  );
}
