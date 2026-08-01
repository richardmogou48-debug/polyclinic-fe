"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { formatDateTime } from "@/lib/medicalRecords";
import {
  SESSION_STATUS_CLASSES,
  fetchSessionsByDoctor,
  fetchSessionsByPatient,
  sessionStatusLabel,
  type TeleconsultationSession,
} from "@/lib/telemedicine";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Sessions de teleconsultation d'un medecin ou d'un patient.
 *
 * L'ecran LISTE les sessions, il n'en ouvre aucune. Rejoindre une consultation suppose la
 * negociation WebRTC que le backend prevoit (SignalType : OFFER, ANSWER, ICE_CANDIDATE) mais
 * qui n'est pas cablee cote client. Plutot qu'un bouton « Rejoindre » qui ne ferait rien, le
 * code de session est affiche et copiable — c'est ce dont un utilisateur a besoin aujourd'hui.
 */
export type PerspectiveTele = "doctor" | "patient";

const NEUTRE = "bg-neutral-100 text-neutral-600";

export default function TeleconsultationSection({ perspective }: { perspective: PerspectiveTele }) {
  const etat = useAuthenticatedResource<TeleconsultationSession[]>(
    (session) => {
      if (!session.profileId) {
        return null;
      }
      const id = Number(session.profileId);
      return perspective === "doctor"
        ? fetchSessionsByDoctor(id, session.token)
        : fetchSessionsByPatient(id, session.token);
    },
    [perspective]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des téléconsultations…" />;
  }
  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Aucune fiche associée"
        description="Ce compte n'a pas de fiche dans l'annuaire, ses téléconsultations ne peuvent donc pas être retrouvées."
      />
    );
  }
  if (etat.phase === "erreur") {
    return (
      <SectionMessage variant="error" title="Téléconsultations indisponibles" description={etat.message} />
    );
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucune téléconsultation"
        description="Aucune consultation à distance n'est programmée."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Sessions de téléconsultation</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Programmée le</th>
            <th scope="col" className="px-4 py-3 font-medium">
              {perspective === "doctor" ? "Patient" : "Médecin"}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">Code de session</th>
            <th scope="col" className="px-4 py-3 font-medium">Déroulement</th>
            <th scope="col" className="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.donnees.map((seance) => {
            // Les identifiants ne sont pas enrichis en nom par ce service, contrairement a
            // AppointmentDetails : on affiche donc la reference telle quelle.
            const interlocuteur = perspective === "doctor" ? seance.patientId : seance.doctorId;
            return (
              <tr key={seance.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3 text-secondary-500">
                  {formatDateTime(seance.scheduledTime)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                  {interlocuteur === null ? "—" : `#${interlocuteur}`}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {seance.sessionCode ? (
                    <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-secondary-500">
                      {seance.sessionCode}
                    </code>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                  {seance.startedAt ? `Démarrée ${formatDateTime(seance.startedAt)}` : "Non démarrée"}
                  {seance.endedAt && <span className="block">Terminée {formatDateTime(seance.endedAt)}</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                      seance.status ? (SESSION_STATUS_CLASSES[seance.status] ?? NEUTRE) : NEUTRE
                    }`}
                  >
                    {sessionStatusLabel(seance.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
