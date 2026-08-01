import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import DirectorySection from "@/components/dashboard/DirectorySection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Personnel" roleLabel={roleConfigs.secretary.label} />
      <main className="flex-1 px-4 py-6 sm:px-8">
        <DirectorySection annuaire="personnel" />
      </main>
    </>
  );
}
