"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { consignerConsultation } from "@/lib/consultations";
import type { MedicalEntry } from "@/lib/medicalRecords";

/**
 * Consultation : le premier acte medical du parcours, et celui dont tout le reste depend.
 *
 * Les examens et les ordonnances s'attachent a une consultation, pas a un patient : sans elle,
 * ni les uns ni les autres ne peuvent etre consignes. C'est pourquoi ce formulaire rend l'entree
 * creee a son appelant plutot que de se contenter d'un message de succes — l'ecran enchaine
 * ensuite sur la demande d'examen sans faire rechercher au medecin la consultation qu'il vient
 * d'ecrire.
 *
 * Ni l'auteur ni la date ne sont saisis : le backend etablit le premier depuis l'identite
 * verifiee et pose la seconde a l'enregistrement.
 */
type Erreurs = Partial<Record<"symptoms" | "diagnosis", string>>;

export default function ConsultationForm({
  patientId,
  nomPatient,
  onConsigne,
  dansModale = false,
}: {
  patientId: number;
  nomPatient?: string;
  /** Recoit l'entree creee : son identifiant ouvre les examens et l'ordonnance. */
  onConsigne?: (entree: MedicalEntry) => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Symptomes et diagnostic sont NOT NULL cote entite : les laisser vides ferait echouer
  // l'enregistrement sur une contrainte de base, message que personne ne saurait lire.
  const valider = (): Erreurs => {
    const trouvees: Erreurs = {};
    if (!symptoms.trim()) trouvees.symptoms = "Les symptômes sont obligatoires.";
    if (!diagnosis.trim()) trouvees.diagnosis = "Le diagnostic est obligatoire.";
    return trouvees;
  };

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees = valider();
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      const entree = await consignerConsultation(
        patientId,
        {
          symptoms: symptoms.trim(),
          diagnosis: diagnosis.trim(),
          treatmentPlan: treatmentPlan.trim() || null,
          additionalNotes: additionalNotes.trim() || null,
        },
        session.token
      );

      if (entree) {
        setSucces("Consultation consignée. Vous pouvez demander des examens ou prescrire.");
        onConsigne?.(entree);
        setSymptoms("");
        setDiagnosis("");
        setTreatmentPlan("");
        setAdditionalNotes("");
      } else {
        // Le backend rend l'entree ; un corps vide signifie que la suite du parcours ne pourra
        // pas s'y rattacher. Le dire vaut mieux que d'afficher un succes trompeur.
        setErreurGlobale(
          "La consultation semble enregistrée mais le serveur n'a pas renvoyé son identifiant : " +
            "rouvrez le dossier du patient pour y attacher examens et ordonnance."
        );
      }
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
      titre="Consigner une consultation"
      description={
        nomPatient
          ? `Consultation de ${nomPatient}. La date et le praticien sont établis automatiquement.`
          : "La date et le praticien sont établis automatiquement."
      }
      dansModale={dansModale}
      actionLibelle="Consigner la consultation"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      {/* Les symptomes occupent toute la largeur : c'est un recit, pas une valeur. */}
      <div className="sm:col-span-2">
        <Field id="symptomes" label="Symptômes" requis erreur={erreurs.symptoms}>
          <textarea
            id="symptomes"
            rows={3}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.symptoms ? true : undefined}
            className={controle(erreurs.symptoms)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field
          id="diagnostic"
          label="Diagnostic"
          requis
          erreur={erreurs.diagnosis}
          aide="Une suspicion est un diagnostic : écrivez-la telle quelle, les examens la trancheront."
        >
          <textarea
            id="diagnostic"
            rows={2}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.diagnosis ? true : undefined}
            className={controle(erreurs.diagnosis)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field id="conduite" label="Conduite à tenir">
          <textarea
            id="conduite"
            rows={2}
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            disabled={enCours}
            className={controle()}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field id="observations" label="Observations">
          <textarea
            id="observations"
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            disabled={enCours}
            className={controle()}
          />
        </Field>
      </div>
    </FormShell>
  );
}
