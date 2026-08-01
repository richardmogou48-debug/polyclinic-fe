import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import FacilitiesSection from "@/components/dashboard/FacilitiesSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Équipements" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <FacilitiesSection registre="equipements" />
      </main>
    </>
  );
}
