import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PlaceholderSection from "@/components/dashboard/PlaceholderSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mon profil" roleLabel={roleConfigs.hr.label} />
      <main className="flex-1 px-8 py-6">
        <PlaceholderSection title="Mon profil" description="Informations personnelles." />
      </main>
    </>
  );
}
