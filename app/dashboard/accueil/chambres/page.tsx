import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import RoomsWorkspace from "@/components/dashboard/RoomsWorkspace";
import { roleConfigs } from "@/lib/navigation";

// Les actions d'entretien sont ouvertes ici : secretary en a le droit cote RoomAccessFilter.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Chambres" roleLabel={roleConfigs.secretary.label} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <RoomsWorkspace />
      </main>
    </>
  );
}
