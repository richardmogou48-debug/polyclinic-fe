import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Patients hospitalisés" roleLabel={roleConfigs.nurse.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Patients hospitalisés" description="Suivi des patients par chambre/lit." />
      </main>
    </>
  );
}
