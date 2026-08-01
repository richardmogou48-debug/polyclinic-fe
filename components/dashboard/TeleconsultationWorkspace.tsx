"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BoutonLigne, useAction } from "@/components/dashboard/ActionsRapides";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import Modal, { BoutonAction } from "@/components/form/Modal";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { formatAppointmentTime, statusLabel } from "@/lib/appointments";
import { fetchAllAppointments } from "@/lib/appointments-all";
import { formatDateTime } from "@/lib/medicalRecords";
import {
  annulerSession,
  demarrerSession,
  fetchSessionsByDoctor,
  ouvrirSession,
  sessionStatusLabel,
  terminerSession,
  SESSION_STATUS_CLASSES,
  type SessionStatus,
} from "@/lib/telemedicine";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Teleconsultations du medecin : ouverture d'un salon, puis conduite de la seance.
 *
 * Le salon ne se cree pas dans le vide — il se rattache a un RENDEZ-VOUS, qui porte deja le
 * patient, le praticien et l'horaire. Le formulaire ne redemande donc rien de tout cela : il fait
 * choisir le rendez-vous, et c'est tout. Ressaisir ces informations les ferait diverger de celles
 * du rendez-vous, sans qu'on sache ensuite laquelle croire.
 *
 * Demarrer, terminer et annuler sont des boutons et non des formulaires : une transition d'etat ne
 * se saisit pas. Comme pour les chambres, chaque bouton n'apparait que si la transition a un sens
 * depuis l'etat courant.
 */
const NEUTRE = "bg-neutral-100 text-neutral-600";

export default function TeleconsultationWorkspace() {
  const [ouverte, setOuverte] = useState(false);
  const [rafraichissements, setRafraichissements] = useState(0);

  const rafraichir = () => setRafraichissements((n) => n + 1);

  const seances = useAuthenticatedResource(
    (session) =>
      session.profileId ? fetchSessionsByDoctor(Number(session.profileId), session.token) : null,
    [rafraichissements]
  );

  const { executer, enCours, erreur } = useAction(rafraichir);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="seances" className="font-heading text-base font-semibold text-secondary-500">
          Téléconsultations
        </h2>
        <BoutonAction onClick={() => setOuverte(true)}>Ouvrir un salon</BoutonAction>
      </div>

      {erreur && (
        <p role="alert" className="text-sm font-medium text-accent-700">
          {erreur}
        </p>
      )}

      <section aria-labelledby="seances">
        {seances.phase === "chargement" && (
          <SectionMessage variant="loading" title="Chargement des séances…" />
        )}
        {seances.phase === "impossible" && (
          <SectionMessage
            variant="error"
            title="Aucune fiche praticien"
            description="Ce compte n'a pas de fiche : ses téléconsultations ne peuvent pas être identifiées."
          />
        )}
        {seances.phase === "erreur" && (
          <SectionMessage variant="error" title="Séances indisponibles" description={seances.message} />
        )}

        {seances.phase === "pret" &&
          (seances.donnees.length === 0 ? (
            <SectionMessage
              variant="empty"
              title="Aucune téléconsultation"
              description="Ouvrez un salon depuis un rendez-vous pour commencer."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Séances de téléconsultation</caption>
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Code du salon</th>
                    <th scope="col" className="px-4 py-3 font-medium">Patient</th>
                    <th scope="col" className="px-4 py-3 font-medium">Prévue le</th>
                    <th scope="col" className="px-4 py-3 font-medium">État</th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {seances.donnees.map((seance) => {
                    const code = seance.sessionCode ?? "";
                    const etat = seance.status;
                    return (
                      <tr
                        key={seance.id}
                        className="transition-colors duration-250 ease-smooth hover:bg-neutral-50"
                      >
                        {/* Le code est ce qu'on communique au patient : il se lit et se dicte,
                            d'ou la police a chasse fixe. */}
                        <td className="whitespace-nowrap px-5 py-3">
                          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-secondary-500">
                            {code || "—"}
                          </code>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                          Fiche {seance.patientId ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                          {formatDateTime(seance.scheduledTime)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                              etat ? (SESSION_STATUS_CLASSES[etat as SessionStatus] ?? NEUTRE) : NEUTRE
                            }`}
                          >
                            {sessionStatusLabel(etat)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {etat === "SCHEDULED" && (
                              <>
                                <BoutonLigne
                                  onClick={() => executer(`start-${code}`, (t) => demarrerSession(code, t))}
                                  disabled={enCours !== null || !code}
                                >
                                  Démarrer
                                </BoutonLigne>
                                <BoutonLigne
                                  onClick={() => executer(`cancel-${code}`, (t) => annulerSession(code, t))}
                                  disabled={enCours !== null || !code}
                                  danger
                                >
                                  Annuler
                                </BoutonLigne>
                              </>
                            )}
                            {etat === "ACTIVE" && (
                              <BoutonLigne
                                onClick={() => executer(`end-${code}`, (t) => terminerSession(code, t))}
                                disabled={enCours !== null || !code}
                              >
                                Terminer
                              </BoutonLigne>
                            )}
                            {/* Une seance terminee ou annulee n'a plus de transition : ne rien
                                proposer vaut mieux qu'un bouton grise qu'on essaiera quand meme. */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <Modal ouverte={ouverte} titre="Ouvrir un salon" onFermer={() => setOuverte(false)}>
        <FormulaireSalon onOuvert={rafraichir} />
      </Modal>
    </>
  );
}

/** Choix du rendez-vous a partir duquel ouvrir le salon. Rien d'autre n'est saisi. */
function FormulaireSalon({ onOuvert }: { onOuvert: () => void }) {
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState("");
  const [erreurChoix, setErreurChoix] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const rendezVous = useAuthenticatedResource((session) => fetchAllAppointments(session.token));
  // Un salon n'a de sens que pour un rendez-vous a venir : en ouvrir un sur un rendez-vous annule
  // ou deja termine creerait une seance que personne ne rejoindra.
  const ouvrables =
    rendezVous.phase === "pret"
      ? rendezVous.donnees.filter((r) => r.status === "SHEDULED" || r.status === "CONFIRMED")
      : [];

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    if (!appointmentId) {
      setErreurChoix("Choisissez le rendez-vous.");
      return;
    }
    setErreurChoix(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      const seance = await ouvrirSession(Number(appointmentId), session.token);
      setSucces(
        seance?.sessionCode
          ? `Salon ouvert. Code à communiquer : ${seance.sessionCode}`
          : "Salon ouvert."
      );
      setAppointmentId("");
      onOuvert();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreurGlobale(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <FormShell
      dansModale
      description="Le salon reprend le patient, le praticien et l'horaire du rendez-vous."
      actionLibelle="Ouvrir le salon"
      actionEnCours="Ouverture…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <div className="sm:col-span-2">
        <Field
          id="salon-rdv"
          label="Rendez-vous"
          requis
          erreur={erreurChoix}
          aide={
            ouvrables.length === 0
              ? "Aucun rendez-vous à venir : seuls les rendez-vous planifiés ou confirmés peuvent recevoir un salon."
              : undefined
          }
        >
          <select
            id="salon-rdv"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
            disabled={enCours || ouvrables.length === 0}
            aria-invalid={erreurChoix ? true : undefined}
            className={controle(erreurChoix)}
          >
            <option value="">Choisir…</option>
            {ouvrables.map((rdv) => (
              <option key={rdv.id} value={rdv.id}>
                {formatAppointmentTime(rdv.appointmentTime)} — {rdv.patientName ?? `Patient ${rdv.patientId}`} (
                {statusLabel(rdv.status)})
              </option>
            ))}
          </select>
        </Field>
      </div>
    </FormShell>
  );
}
