"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { planifierRendezVous, planifierRendezVousExamen, versLocalDateTime } from "@/lib/appointments";
import { examCategoryLabel, fetchBillableExams } from "@/lib/medicalRecords";
import { fetchAllDoctors, fetchAllPatients } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Planification d'un rendez-vous : consultation chez un medecin, ou examen vers son plateau.
 *
 * Patient et medecin se choisissent dans les annuaires plutot que par identifiant : un numero
 * saisi a la main est une faute de frappe qui ouvre un creneau au nom de quelqu'un d'autre, et
 * rien dans le dossier ne la signalerait ensuite. Meme logique pour l'examen : il se choisit
 * parmi les demandes en attente du patient, jamais par un identifiant libre.
 *
 * L'etat n'est pas saisissable. Le backend pose SHEDULED, et la confirmation se fait par un geste
 * distinct : offrir une liste d'etats laisserait croire qu'on peut ouvrir un creneau deja marque
 * confirme, sans que personne ne l'ait confirme.
 */
type Erreurs = Partial<Record<"patient" | "doctor" | "examen" | "date", string>>;

export default function AppointmentForm({
  onPlanifie,
  dansModale = false,
}: {
  onPlanifie?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [typeRdv, setTypeRdv] = useState<"consultation" | "examen">("consultation");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [examId, setExamId] = useState("");
  const [quand, setQuand] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  // Identifiant du rendez-vous qui vient d'etre pris : c'est la que la convocation se remet.
  const [dernierRdv, setDernierRdv] = useState<number | null>(null);

  const patients = useAuthenticatedResource((session) => fetchAllPatients(session.token));
  const medecins = useAuthenticatedResource((session) => fetchAllDoctors(session.token));

  // Les demandes d'examen encore en attente du patient choisi : les seules programmables.
  const examens = useAuthenticatedResource(
    (session) =>
      typeRdv === "examen" && patientId
        ? fetchBillableExams(Number(patientId), session.token)
        : Promise.resolve([]),
    [typeRdv, patientId]
  );

  const listePatients = patients.phase === "pret" ? patients.donnees : [];
  const listeMedecins = medecins.phase === "pret" ? medecins.donnees : [];
  const listeExamens = (examens.phase === "pret" ? examens.donnees : []).filter(
    (examen) => examen.status === "REQUESTED"
  );

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees: Erreurs = {};
    if (!patientId) trouvees.patient = "Choisissez le patient.";
    if (typeRdv === "consultation" && !doctorId) trouvees.doctor = "Choisissez le médecin.";
    if (typeRdv === "examen" && !examId) trouvees.examen = "Choisissez l'examen à programmer.";
    if (!quand) trouvees.date = "Indiquez la date et l'heure.";
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    setDernierRdv(null);
    try {
      let cree: number | null;
      if (typeRdv === "examen") {
        cree = await planifierRendezVousExamen(
          {
            patientId: Number(patientId),
            examRequestId: Number(examId),
            appointmentTime: versLocalDateTime(quand),
            notes: notes.trim() || null,
          },
          session.token
        );
      } else {
        cree = await planifierRendezVous(
          {
            patientId: Number(patientId),
            doctorId: Number(doctorId),
            appointmentTime: versLocalDateTime(quand),
            reason: reason.trim() || null,
            notes: notes.trim() || null,
          },
          session.token
        );
      }
      if (typeof cree === "number") {
        setDernierRdv(cree);
      }

      setSucces(typeRdv === "examen" ? "Rendez-vous d'examen planifié." : "Rendez-vous planifié.");
      setPatientId("");
      setDoctorId("");
      setExamId("");
      setQuand("");
      setReason("");
      setNotes("");
      onPlanifie?.();
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
      titre="Planifier un rendez-vous"
      description="Le rendez-vous est créé à l'état « planifié ». La confirmation se fait ensuite."
      dansModale={dansModale}
      actionLibelle="Planifier"
      actionEnCours="Planification…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      {/* La convocation se remet au patient au moment de la prise : le lien apparait aussitot. */}
      {dernierRdv !== null && (
        <p className="sm:col-span-2 -mt-1">
          <a
            href={`/print/convocation/${dernierRdv}`}
            target="_blank"
            rel="noopener"
            className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
          >
            Imprimer la convocation
          </a>
        </p>
      )}

      {/* Deux natures de rendez-vous, un seul formulaire : la consultation vise un medecin,
          l'examen vise le plateau qui realisera une demande deja prescrite. */}
      <div className="sm:col-span-2">
        <fieldset className="flex gap-4">
          <legend className="mb-1 text-sm font-medium text-secondary-500">Nature du rendez-vous</legend>
          {(
            [
              ["consultation", "Consultation"],
              ["examen", "Examen"],
            ] as const
          ).map(([valeur, libelle]) => (
            <label key={valeur} className="flex items-center gap-2 text-sm text-secondary-500">
              <input
                type="radio"
                name="rdv-type"
                value={valeur}
                checked={typeRdv === valeur}
                onChange={() => setTypeRdv(valeur)}
                disabled={enCours}
                className="h-4 w-4 border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              {libelle}
            </label>
          ))}
        </fieldset>
      </div>

      <Field id="rdv-patient" label="Patient" requis erreur={erreurs.patient}>
        <select
          id="rdv-patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.patient ? true : undefined}
          className={controle(erreurs.patient)}
        >
          <option value="">Choisir…</option>
          {listePatients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name ?? `Patient ${patient.id}`}
            </option>
          ))}
        </select>
      </Field>

      {typeRdv === "consultation" ? (
        <Field id="rdv-medecin" label="Médecin" requis erreur={erreurs.doctor}>
          <select
            id="rdv-medecin"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.doctor ? true : undefined}
            className={controle(erreurs.doctor)}
          >
            <option value="">Choisir…</option>
            {listeMedecins.map((medecin) => (
              <option key={medecin.id} value={medecin.id}>
                {medecin.name ?? `Médecin ${medecin.id}`}
                {medecin.specialization ? ` — ${medecin.specialization}` : ""}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field
          id="rdv-examen"
          label="Examen à programmer"
          requis
          erreur={erreurs.examen}
          aide={
            patientId && listeExamens.length === 0
              ? "Ce patient n'a aucun examen en attente : l'examen se prescrit d'abord en consultation."
              : "Les demandes en attente du patient choisi."
          }
        >
          <select
            id="rdv-examen"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            disabled={enCours || !patientId}
            aria-invalid={erreurs.examen ? true : undefined}
            className={controle(erreurs.examen)}
          >
            <option value="">{patientId ? "Choisir…" : "Choisissez d'abord le patient"}</option>
            {listeExamens.map((examen) => (
              <option key={examen.id} value={examen.id}>
                {(examen.label ?? `Examen ${examen.id}`) +
                  " — " +
                  examCategoryLabel(examen.category)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="sm:col-span-2">
        <Field id="rdv-date" label="Date et heure" requis erreur={erreurs.date}>
          <input
            id="rdv-date"
            type="datetime-local"
            value={quand}
            onChange={(e) => setQuand(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.date ? true : undefined}
            className={controle(erreurs.date)}
          />
        </Field>
      </div>

      {/* Le motif d'un rendez-vous d'examen est l'examen lui-meme : le backend y recopie son
          libelle, une saisie ici serait ecrasee ou redondante. */}
      {typeRdv === "consultation" && (
        <div className="sm:col-span-2">
          <Field id="rdv-motif" label="Motif">
            <input
              id="rdv-motif"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={enCours}
              className={controle()}
            />
          </Field>
        </div>
      )}

      <div className="sm:col-span-2">
        <Field id="rdv-notes" label="Notes">
          <textarea
            id="rdv-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={enCours}
            className={controle()}
          />
        </Field>
      </div>
    </FormShell>
  );
}
