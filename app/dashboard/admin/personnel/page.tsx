import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import DirectorySection from "@/components/dashboard/DirectorySection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Personnel" roleLabel={roleConfigs.admin.label} />
      <main className="flex-1 px-8 py-6">
        <DirectorySection annuaire="personnel" />
      </main>
    </>
  );
}
