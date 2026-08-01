import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import SettingsSection from "@/components/dashboard/SettingsSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Paramètres" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <SettingsSection />
      </main>
    </>
  );
}
