import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import RoomsSection from "@/components/dashboard/RoomsSection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Chambres" roleLabel={roleConfigs.secretary.label} />
      <main className="flex-1 px-8 py-6">
        <RoomsSection />
      </main>
    </>
  );
}
