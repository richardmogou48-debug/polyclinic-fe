import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ProfileSection from "@/components/dashboard/ProfileSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mon profil" roleLabel={roleConfigs.imagerie.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <ProfileSection />
      </main>
    </>
  );
}
