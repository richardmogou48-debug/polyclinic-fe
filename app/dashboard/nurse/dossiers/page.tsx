import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Dossiers médicaux" roleLabel={roleConfigs.nurse.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <PlaceholderSection title="Dossiers médicaux" description="Consultation des dossiers." />
      </main>
    </>
  );
}
