import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Téléconsultation" roleLabel={roleConfigs.patient.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Téléconsultation" description="Rejoindre une consultation à distance." />
      </main>
    </>
  );
}
