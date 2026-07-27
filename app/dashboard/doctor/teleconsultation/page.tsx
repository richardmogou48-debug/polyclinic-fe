import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Téléconsultation" roleLabel={roleConfigs.doctor.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Téléconsultation" description="Sessions de téléconsultation." />
      </main>
    </>
  );
}
