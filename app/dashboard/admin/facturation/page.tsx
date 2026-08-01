import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import BillingWorkspace from "@/components/dashboard/BillingWorkspace";
import { roleConfigs } from "@/lib/navigation";

export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Facturation" roleLabel={roleConfigs.admin.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <BillingWorkspace />
      </main>
    </>
  );
}
