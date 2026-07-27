import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Équipements" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Équipements" description="Parc d'équipements médicaux." />
      </main>
    </>
  );
}
