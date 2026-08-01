"use client";

import { useState } from "react";
import ConsultationForm from "@/components/dashboard/ConsultationForm";
import ExamRequestForm from "@/components/dashboard/ExamRequestForm";
import HospitalisationForm from "@/components/dashboard/HospitalisationForm";
import PrescriptionForm from "@/components/dashboard/PrescriptionForm";
import SectionMessage from "@/components/dashboard/SectionMessage";
import Modal, { BoutonAction } from "@/components/form/Modal";
import { controle } from "@/components/form/Field";
import { examCategoryLabel, examStatusLabel, fetchMedicalRecord, formatDateTime } from "@/lib/medicalRecords";
import type { MedicalEntry } from "@/lib/medicalRecords";
import { fetchAllPatients } from "@/lib/profiles";
import { fetchCurrentStays } from "@/lib/rooms";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Poste de consultation du medecin : tout le parcours clinique sur un seul ecran.
 *
 * Il existe parce que les actes s'enchainent et dependent les uns des autres. Examens et
 * ordonnances s'attachent a une CONSULTATION, pas a un patient : les eparpiller sur des ecrans
 * separes obligerait le medecin a retrouver a chaque fois la consultation qu'il vient d'ecrire,
 * et rien ne garantirait qu'il retombe sur la bonne.
 *
 * D'ou la contrainte visible ici : tant qu'aucune consultation n'est choisie, ni la demande
 * d'examen ni l'ordonnance ne sont proposees. Ce n'est pas une precaution d'affichage — sans
 * identifiant de consultation, ces routes n'existent tout simplement pas.
 */
type Modale = "consultation" | "examen" | "ordonnance" | "hospitalisation" | null;

export default function ConsultationWorkspace() {
  const [patientId, setPatientId] = useState<number | null>(null);
  const [entreeId, setEntreeId] = useState<number | null>(null);
  const [modale, setModale] = useState<Modale>(null);
  const [rafraichissements, setRafraichissements] = useState(0);

  const patients = useAuthenticatedResource((session) => fetchAllPatients(session.token));

  const dossier = useAuthenticatedResource(
    (session) => (patientId === null ? null : fetchMedicalRecord(patientId, session.token)),
    [patientId, rafraichissements]
  );

  const sejours = useAuthenticatedResource(
    (session) => fetchCurrentStays(session.token),
    [rafraichissements]
  );

  const rafraichir = () => setRafraichissements((n) => n + 1);

  // Une consultation ecrite devient la consultation courante : c'est celle a laquelle le medecin
  // va rattacher ses examens et son ordonnance dans la minute qui suit.
  const surConsultationConsignee = (entree: MedicalEntry) => {
    setEntreeId(entree.id);
    rafraichir();
  };

  const listePatients = patients.phase === "pret" ? patients.donnees : [];
  const nomPatient = listePatients.find((p) => p.id === patientId)?.name ?? undefined;

  const consultations =
    dossier.phase === "pret"
      ? [...(dossier.donnees.entries ?? [])].sort((a, b) =>
          (b.consultationDate ?? "").localeCompare(a.consultationDate ?? "")
        )
      : [];
  const consultation = consultations.find((e) => e.id === entreeId) ?? null;

  // Le drapeau qui devoile le champ de derogation. Ce n'est qu'un confort : l'autorite reste au
  // refus 409 du backend, que PrescriptionForm sait interpreter.
  const examensEnAttente = (consultation?.exams ?? []).some((e) => e.status === "REQUESTED");

  const sejour =
    sejours.phase === "pret" && patientId !== null
      ? (sejours.donnees.find((s) => s.patientId === patientId) ?? null)
      : null;

  return (
    <>
      <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
        <label htmlFor="patient" className="text-sm font-medium text-secondary-500">
          Patient
        </label>
        <select
          id="patient"
          value={patientId ?? ""}
          onChange={(e) => {
            // Changer de patient remet la consultation a zero : conserver celle du precedent
            // ferait rattacher un examen au dossier de quelqu'un d'autre.
            setPatientId(e.target.value ? Number(e.target.value) : null);
            setEntreeId(null);
          }}
          className={`mt-1 ${controle()}`}
        >
          <option value="">Choisir un patient…</option>
          {listePatients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name ?? `Patient ${patient.id}`}
            </option>
          ))}
        </select>
        {patients.phase === "erreur" && (
          <p className="mt-2 text-xs text-accent-700">{patients.message}</p>
        )}
      </div>

      {patientId === null ? (
        <SectionMessage
          variant="empty"
          title="Aucun patient sélectionné"
          description="Choisissez un patient pour consigner une consultation, demander des examens ou prescrire."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <BoutonAction onClick={() => setModale("consultation")}>
              Consigner une consultation
            </BoutonAction>
            <BoutonAction onClick={() => setModale("hospitalisation")}>
              {sejour ? "Transférer ou faire sortir" : "Hospitaliser"}
            </BoutonAction>
          </div>

          {dossier.phase === "chargement" && (
            <SectionMessage variant="loading" title="Chargement du dossier…" />
          )}
          {dossier.phase === "erreur" && (
            <SectionMessage variant="error" title="Dossier indisponible" description={dossier.message} />
          )}

          {dossier.phase === "pret" && (
            <section className="rounded-lg border border-neutral-200 bg-white">
              <header className="border-b border-neutral-200 px-5 py-4">
                <h2 className="font-heading text-base font-semibold text-secondary-500">
                  Consultations
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Sélectionnez la consultation à laquelle rattacher un examen ou une ordonnance.
                </p>
              </header>

              {consultations.length === 0 ? (
                <p className="px-5 py-6 text-sm text-neutral-500">
                  Aucune consultation dans ce dossier. Commencez par en consigner une.
                </p>
              ) : (
                <ol className="flex flex-col gap-3 px-5 py-4">
                  {consultations.map((entree) => {
                    const active = entree.id === entreeId;
                    const enAttente = (entree.exams ?? []).some((e) => e.status === "REQUESTED");
                    return (
                      <li key={entree.id}>
                        <button
                          type="button"
                          onClick={() => setEntreeId(active ? null : entree.id)}
                          aria-pressed={active}
                          className={`w-full rounded-md border p-4 text-left transition-colors duration-250 ease-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                            active
                              ? "border-primary-500 bg-primary-50"
                              : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                          }`}
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            {formatDateTime(entree.consultationDate)}
                          </p>
                          <p className="mt-1 font-medium text-secondary-500">
                            {entree.diagnosis || "Diagnostic non renseigné"}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {(entree.exams ?? []).length} examen(s) ·{" "}
                            {(entree.prescriptions ?? []).length} ordonnance(s)
                            {enAttente && (
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                                Résultat en attente
                              </span>
                            )}
                          </p>
                        </button>

                        {active && (
                          <div className="mt-3 rounded-md border border-neutral-200 bg-white p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <BoutonAction onClick={() => setModale("examen")}>
                                Demander un examen
                              </BoutonAction>
                              <BoutonAction onClick={() => setModale("ordonnance")}>
                                Prescrire un traitement
                              </BoutonAction>
                            </div>

                            {(entree.exams ?? []).length > 0 && (
                              <ul className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-3">
                                {(entree.exams ?? []).map((examen) => (
                                  <li key={examen.id} className="text-sm">
                                    <span className="font-medium text-secondary-500">
                                      {examen.label ?? "Examen non nommé"}
                                    </span>
                                    <span className="text-neutral-500">
                                      {" "}
                                      — {examCategoryLabel(examen.category)}
                                    </span>
                                    {examen.urgent && (
                                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                                        Urgent
                                      </span>
                                    )}
                                    <p className="mt-0.5 text-neutral-600">
                                      {examen.result
                                        ? (examen.result.conclusion ??
                                          examen.result.findings ??
                                          "Résultat rendu")
                                        : examStatusLabel(examen.status)}
                                      {examen.result?.abnormal && (
                                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                                          Hors normes
                                        </span>
                                      )}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}
        </>
      )}

      {patientId !== null && (
        <>
          <Modal
            ouverte={modale === "consultation"}
            titre="Consigner une consultation"
            onFermer={() => setModale(null)}
          >
            <ConsultationForm
              dansModale
              patientId={patientId}
              nomPatient={nomPatient}
              onConsigne={surConsultationConsignee}
            />
          </Modal>

          <Modal
            ouverte={modale === "hospitalisation"}
            titre={sejour ? "Transférer ou faire sortir" : "Hospitaliser un patient"}
            onFermer={() => setModale(null)}
          >
            <HospitalisationForm
              dansModale
              patientId={patientId}
              nomPatient={nomPatient}
              sejour={sejour}
              onChangement={rafraichir}
            />
          </Modal>
        </>
      )}

      {/* Ces deux modales exigent une consultation : leur route n'existe pas sans elle. */}
      {entreeId !== null && (
        <>
          <Modal ouverte={modale === "examen"} titre="Demander un examen" onFermer={() => setModale(null)}>
            <ExamRequestForm dansModale entryId={entreeId} onDemande={rafraichir} />
          </Modal>

          <Modal
            ouverte={modale === "ordonnance"}
            titre="Prescrire un traitement"
            onFermer={() => setModale(null)}
          >
            <PrescriptionForm
              dansModale
              entryId={entreeId}
              examensEnAttente={examensEnAttente}
              onPrescrit={rafraichir}
            />
          </Modal>
        </>
      )}
    </>
  );
}
