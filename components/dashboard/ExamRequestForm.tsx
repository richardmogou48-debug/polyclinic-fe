"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { demanderExamen } from "@/lib/consultations";
import { EXAM_CATEGORY_LABELS, type ExamCategory, type ExamRequest } from "@/lib/medicalRecords";

/**
 * Demande d'examen, rattachee a une consultation.
 *
 * Le libelle reste du texte libre : aucune nomenclature d'actes n'est en place, et une liste
 * fermee refuserait des examens legitimes. La categorie, elle, est contrainte — elle sert a
 * orienter vers le bon plateau technique, pas a decrire l'acte.
 *
 * Enchainer plusieurs demandes est le cas courant — bilan sanguin et radiographie le meme jour —
 * d'ou un formulaire qui se vide et reste ouvert apres chaque enregistrement.
 */
const CATEGORIES = Object.entries(EXAM_CATEGORY_LABELS) as [ExamCategory, string][];

export default function ExamRequestForm({
  entryId,
  onDemande,
  dansModale = false,
}: {
  entryId: number;
  onDemande?: (demande: ExamRequest) => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ExamCategory>("BIOLOGY");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [erreurLibelle, setErreurLibelle] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    if (!label.trim()) {
      setErreurLibelle("Précisez l'examen demandé.");
      return;
    }
    setErreurLibelle(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      const demande = await demanderExamen(
        entryId,
        {
          category,
          label: label.trim(),
          clinicalIndication: clinicalIndication.trim() || null,
          urgent,
        },
        session.token
      );

      setSucces(`Examen demandé : ${label.trim()}`);
      if (demande) onDemande?.(demande);
      setLabel("");
      setClinicalIndication("");
      setUrgent(false);
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
      titre="Demander un examen"
      description="L'examen rejoint la file du plateau technique. Le traitement attend son résultat."
      dansModale={dansModale}
      actionLibelle="Demander l'examen"
      actionEnCours="Envoi…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field
        id="examen-libelle"
        label="Examen"
        requis
        erreur={erreurLibelle}
        aide="Par exemple : NFS, goutte épaisse, radiographie thoracique de face."
      >
        <input
          id="examen-libelle"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurLibelle ? true : undefined}
          className={controle(erreurLibelle)}
        />
      </Field>

      <Field id="examen-categorie" label="Nature">
        <select
          id="examen-categorie"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExamCategory)}
          disabled={enCours}
          className={controle()}
        >
          {CATEGORIES.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="examen-indication"
          label="Indication clinique"
          aide="Ce qu'on cherche. Sans elle, celui qui réalise l'examen ne peut pas l'interpréter."
        >
          <textarea
            id="examen-indication"
            rows={2}
            value={clinicalIndication}
            onChange={(e) => setClinicalIndication(e.target.value)}
            disabled={enCours}
            className={controle()}
          />
        </Field>
      </div>

      {/* Une case, pas une echelle de priorite : une echelle que personne n'arbitre finit
          entierement en haut, et ne trie plus rien. */}
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-secondary-500">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            disabled={enCours}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          Urgent — à réaliser avant que le patient reparte
        </label>
      </div>
    </FormShell>
  );
}
