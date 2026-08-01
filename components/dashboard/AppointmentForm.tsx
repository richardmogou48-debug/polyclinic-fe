"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { planifierRendezVous, versLocalDateTime } from "@/lib/appointments";
import { fetchAllDoctors, fetchAllPatients } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Planification d'un rendez-vous.
 *
 * Patient et medecin se choisissent dans les annuaires plutot que par identifiant : un numero
 * saisi a la main est une faute de frappe qui ouvre un creneau au nom de quelqu'un d'autre, et
 * rien dans le dossier ne la signalerait ensuite.
 *
 * L'etat n'est pas saisissable. Le backend pose SHEDULED, et la confirmation se fait par un geste
 * distinct : offrir une liste d'etats laisserait croire qu'on peut ouvrir un creneau deja marque
 * confirme, sans que personne ne l'ait confirme.
 */
type Erreurs = Partial<Record<"patient" | "doctor" | "date", string>>;

export default function AppointmentForm({
  onPlanifie,
  dansModale = false,
}: {
  onPlanifie?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [quand, setQuand] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const patients = useAuthenticatedResource((session) => fetchAllPatients(session.token));
  const medecins = useAuthenticatedResource((session) => fetchAllDoctors(session.token));

  const listePatients = patients.phase === "pret" ? patients.donnees : [];
  const listeMedecins = medecins.phase === "pret" ? medecins.donnees : [];

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees: Erreurs = {};
    if (!patientId) trouvees.patient = "Choisissez le patient.";
    if (!doctorId) trouvees.doctor = "Choisissez le médecin.";
    if (!quand) trouvees.date = "Indiquez la date et l'heure.";
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await planifierRendezVous(
        {
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          appointmentTime: versLocalDateTime(quand),
          reason: reason.trim() || null,
          notes: notes.trim() || null,
        },
        session.token
      );

      setSucces("Rendez-vous planifié.");
      setPatientId("");
      setDoctorId("");
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
