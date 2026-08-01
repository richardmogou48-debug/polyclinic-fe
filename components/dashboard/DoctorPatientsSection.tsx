"use client";

import { useState } from "react";
import MedicalRecordSection from "@/components/dashboard/MedicalRecordSection";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { fetchAppointmentsByDoctor, formatAppointmentTime } from "@/lib/appointments";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import type { Appointment } from "@/lib/appointments";

/**
 * Patients d'un medecin, et le dossier de celui qu'il selectionne.
 *
 * La liste est derivee de ses rendez-vous, et non de l'annuaire des patients — que
 * GET /profile/patient lui ouvrirait pourtant. Deux raisons : le menu promet « vos patients »,
 * et un medecin n'a pas de motif d'ouvrir la liste de ceux qu'il n'a jamais recus. C'est aussi
 * le contournement de l'absence de route « patients d'un medecin » cote backend ; le jour ou
 * elle existera, seul ce composant changera.
 */
type Vu = { patientId: number; nom: string; derniere: string | null };

/** Dedoublonne par patient et retient la date du rendez-vous le plus recent. */
function patientsVus(rendezVous: Appointment[]): Vu[] {
  const parPatient = new Map<number, Vu>();

  for (const rdv of rendezVous) {
    if (rdv.patientId === null) {
      continue;
    }
    const existant = parPatient.get(rdv.patientId);
    const plusRecent =
      !existant ||
      (rdv.appointmentTime !== null &&
        (existant.derniere === null || rdv.appointmentTime > existant.derniere));

    if (!existant || plusRecent) {
      parPatient.set(rdv.patientId, {
        patientId: rdv.patientId,
        // Le nom peut manquer si ProfileMS n'a pas repondu a l'enrichissement.
        nom: rdv.patientName ?? existant?.nom ?? `Patient #${rdv.patientId}`,
        derniere: plusRecent ? rdv.appointmentTime : (existant?.derniere ?? null),
      });
    }
  }

  // Les consultations les plus recentes d'abord : c'est l'ordre dans lequel un medecin cherche.
  return [...parPatient.values()].sort((a, b) => (b.derniere ?? "").localeCompare(a.derniere ?? ""));
}

export default function DoctorPatientsSection() {
  const [selection, setSelection] = useState<Vu | null>(null);

  const etat = useAuthenticatedResource(
    (session) =>
      session.profileId
        ? fetchAppointmentsByDoctor(Number(session.profileId), session.token)
        : null,
    []
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement de vos patients…" />;
  }

  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Aucune fiche médecin associée"
        description="Ce compte n'a pas de fiche dans l'annuaire, ses patients ne peuvent donc pas être identifiés. Un administrateur doit lui en rattacher une."
      />
    );
  }

  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Patients indisponibles" description={etat.message} />;
  }

  const patients = patientsVus(etat.donnees);

  if (patients.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun patient"
        description="Aucun patient n'a encore été reçu en consultation à votre nom."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav aria-label="Vos patients" className="w-full shrink-0 lg:w-72">
        <ul className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {patients.map((patient) => {
            const actif = selection?.patientId === patient.patientId;
            return (
              <li key={patient.patientId} className="border-b border-neutral-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelection(patient)}
                  aria-current={actif || undefined}
                  className={`w-full px-4 py-3 text-left transition-colors duration-250 ease-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset ${
                    actif ? "bg-primary-50" : "hover:bg-neutral-50"
                  }`}
                >
                  <span className={`block text-sm font-medium ${actif ? "text-primary-700" : "text-secondary-500"}`}>
                    {patient.nom}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    Dernière consultation : {formatAppointmentTime(patient.derniere)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1">
        {selection === null ? (
          <SectionMessage
            variant="empty"
            title="Sélectionnez un patient"
            description="Choisissez un patient dans la liste pour ouvrir son dossier médical."
          />
        ) : (
          // La cle force le remontage a chaque changement de patient : sans elle, l'ancien
          // dossier resterait affiche pendant le chargement du nouveau.
          <MedicalRecordSection key={selection.patientId} patientId={selection.patientId} />
        )}
      </div>
    </div>
  );
}
