import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Dossiers patients" roleLabel={roleConfigs.doctor.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Dossiers patients" description="Dossiers médicaux de vos patients." />
      </main>
    </>
  );
}
