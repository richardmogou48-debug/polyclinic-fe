import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import QualitySection from "@/components/dashboard/QualitySection";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Plaintes" roleLabel={roleConfigs.quality.label} />
      <main className="flex-1 px-8 py-6">
        <QualitySection registre="complaint" />
      </main>
    </>
  );
}
