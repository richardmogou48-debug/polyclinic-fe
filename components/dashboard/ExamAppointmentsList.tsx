"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import {
  fetchExamAppointments,
  formatAppointmentTime,
  statusLabel,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments";
import { examCategoryLabel } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Le planning des examens d'un plateau, du plus proche au plus lointain.
 *
 * Lecture seule : confirmer, deplacer ou annuler restent des gestes de l'accueil, qui tient le
 * planning de l'etablissement — le plateau consulte son programme, il ne le negocie pas ici.
 */
const CLASSES_STATUT: Record<AppointmentStatus, string> = {
  SHEDULED: "bg-tertiary-50 text-tertiary-700",
  CONFIRMED: "bg-primary-50 text-primary-700",
  CANCELLED: "bg-neutral-100 text-neutral-600",
  COMPLETED: "bg-neutral-100 text-neutral-600",
};

export default function ExamAppointmentsList({ categorie }: { categorie?: string }) {
  const etat = useAuthenticatedResource<Appointment[]>(
    (session) => fetchExamAppointments(session.token, categorie),
    [categorie]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du planning…" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Planning indisponible" description={etat.message} />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Planning indisponible" />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun rendez-vous d'examen"
        description="Les rendez-vous se prennent à l'accueil, sur les examens prescrits en consultation."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Rendez-vous d'examens du plateau</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">Date et heure</th>
            <th scope="col" className="px-4 py-3 font-medium">Examen</th>
            <th scope="col" className="px-4 py-3 font-medium">Nature</th>
            <th scope="col" className="px-4 py-3 font-medium">Patient</th>
            <th scope="col" className="px-4 py-3 font-medium">Téléphone</th>
            <th scope="col" className="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {etat.donnees.map((rdv) => (
            <tr key={rdv.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
              <td className="whitespace-nowrap px-5 py-3 text-neutral-600">
                {formatAppointmentTime(rdv.appointmentTime)}
              </td>
              <td className="px-4 py-3 font-medium text-secondary-500">
                {rdv.examLabel ?? rdv.reason ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                {examCategoryLabel(rdv.examCategory)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                {rdv.patientName ?? (rdv.patientId === null ? "—" : `Fiche ${rdv.patientId}`)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{rdv.patientPhone ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    "rounded px-1.5 py-0.5 text-xs font-medium " +
                    (rdv.status ? (CLASSES_STATUT[rdv.status] ?? "bg-neutral-100 text-neutral-600") : "bg-neutral-100 text-neutral-600")
                  }
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
