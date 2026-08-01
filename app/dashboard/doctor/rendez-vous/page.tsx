import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { roleConfigs } from "@/lib/navigation";
import DoctorAppointments from "./DoctorAppointments";

// La page reste un composant serveur : seule la section qui lit le jeton et appelle la Gateway
// a besoin de tourner dans le navigateur.
export default function Page() {
  return (
    <>
      <DashboardPageHeader title="Mes rendez-vous" roleLabel={roleConfigs.doctor.label} />
      <main className="flex-1 px-8 py-6">
        <DoctorAppointments />
      </main>
    </>
  );
}
