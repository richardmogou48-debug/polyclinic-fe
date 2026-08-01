import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import DirectorySection from "@/components/dashboard/DirectorySection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Utilisateurs" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <DirectorySection annuaire="comptes" />
      </main>
    </>
  );
}
