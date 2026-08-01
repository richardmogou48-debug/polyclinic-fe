import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import RoomsWorkspace from "@/components/dashboard/RoomsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// Les actions d'entretien sont ouvertes ici : nurse en a le droit cote RoomAccessFilter.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Chambres" roleLabel={roleConfigs.nurse.label} />
      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <RoomsWorkspace />
      </main>
    </>
  );
}
