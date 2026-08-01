"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  fetchAppointmentsByDoctor,
  formatAppointmentTime,
  statusLabel,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments";

/**
 * Le chargement se fait cote navigateur, et non dans un composant serveur : le jeton vit dans
 * localStorage, auquel le serveur n'a pas acces. La doc Next suggere `use` + Suspense ou SWR,
 * mais la premiere suppose un fetch serveur et la seconde n'est pas dans les dependances.
 */
type Etat =
  | { phase: "chargement" }
  | { phase: "erreur"; message: string }
  | { phase: "sans-fiche" }
  | { phase: "pret"; rendezVous: Appointment[] };

const CLASSES_STATUT: Record<AppointmentStatus, string> = {
  SHEDULED: "bg-tertiary-50 text-tertiary-700",
  CONFIRMED: "bg-primary-50 text-primary-700",
  CANCELLED: "bg-accent-50 text-accent-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
};

export default function DoctorAppointments() {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>({ phase: "chargement" });

  useEffect(() => {
    // Evite d'ecrire dans un composant demonte si l'utilisateur quitte la page en cours de requete.
    let actif = true;

    const charger = async () => {
      const session = readSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      // Un compte sans fiche ProfileMS n'a pas d'identifiant de planning. Le cas se produit
      // pour tout compte cree directement en base plutot que par /user/register ou le seeder,
      // qui sont les seuls chemins provisionnant une fiche. Message explicite plutot qu'une
      // liste vide, qui laisserait croire a une absence de rendez-vous.
      if (!session.profileId) {
        if (actif) {
          setEtat({ phase: "sans-fiche" });
        }
        return;
      }

      try {
        const rendezVous = await fetchAppointmentsByDoctor(
          Number(session.profileId),
          session.token
        );
        if (actif) {
          setEtat({ phase: "pret", rendezVous });
        }
      } catch (cause) {
        if (!actif) {
          return;
        }
        if (cause instanceof UnauthorizedError) {
          clearSession();
          router.replace("/login");
          return;
        }
        const attendu = cause instanceof ApiError;
        if (!attendu) {
          console.error(cause);
        }
        setEtat({
          phase: "erreur",
          message: attendu ? cause.message : "Une erreur inattendue est survenue.",
        });
      }
    };

    void charger();
    return () => {
      actif = false;
    };
  }, [router]);

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du planning…" />;
  }

  if (etat.phase === "sans-fiche") {
    return (
      <SectionMessage
        variant="error"
        title="Aucune fiche médecin associée"
        description="Ce compte n'a pas de fiche dans l'annuaire, son planning ne peut donc pas être identifié. Un administrateur doit lui en rattacher une."
      />
    );
  }

  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Planning indisponible" description={etat.message} />;
  }

  if (etat.rendezVous.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun rendez-vous"
        description="Aucune consultation n'est planifiée à votre nom pour le moment."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Vos consultations planifiées</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Date et heure</th>
            <th scope="col" className="px-4 py-3 font-medium">Patient</th>
            <th scope="col" className="px-4 py-3 font-medium">Motif</th>
            <th scope="col" className="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.rendezVous.map((rdv) => (
            <tr key={rdv.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
              <td className="whitespace-nowrap px-4 py-3 text-secondary-500">
                {formatAppointmentTime(rdv.appointmentTime)}
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-secondary-500">{rdv.patientName ?? "—"}</span>
                {rdv.patientPhone && (
                  <span className="block text-xs text-neutral-500">{rdv.patientPhone}</span>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600">{rdv.reason ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                    rdv.status ? CLASSES_STATUT[rdv.status] ?? "bg-neutral-100 text-neutral-600" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {statusLabel(rdv.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
