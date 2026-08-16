"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { montant } from "@/lib/billing";
import { demanderExamen } from "@/lib/consultations";
import {
  EXAM_CATEGORY_LABELS,
  examCategoryLabel,
  fetchExamCatalog,
  type ExamCategory,
  type ExamRequest,
} from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Demande d'examen, rattachee a une consultation.
 *
 * Le medecin choisit d'abord dans la nomenclature : libelle, categorie et tarif y font foi, et
 * deux NFS portent ainsi le meme nom. La saisie libre reste offerte en repli — un acte absent du
 * catalogue est un acte legitime, pas une erreur.
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

  // "" = saisie libre. Sinon l'identifiant de l'acte choisi dans la nomenclature.
  const [acteId, setActeId] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ExamCategory>("BIOLOGY");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [urgent, setUrgent] = useState(false);

  // L'echec du chargement n'empeche pas de prescrire : la saisie libre reste le repli.
  const catalogue = useAuthenticatedResource((session) => fetchExamCatalog(session.token));
  const actes = catalogue.phase === "pret" ? catalogue.donnees : [];
  const acteChoisi = actes.find((acte) => String(acte.id) === acteId) ?? null;

  const [erreurLibelle, setErreurLibelle] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    if (!acteChoisi && !label.trim()) {
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
      // Le backend reprend libelle et categorie de l'acte quand catalogItemId est present :
      // ceux envoyes ici ne servent alors que de valeur d'affichage en attendant sa reponse.
      const libelle = acteChoisi ? (acteChoisi.label ?? `Acte ${acteChoisi.id}`) : label.trim();
      const demande = await demanderExamen(
        entryId,
        {
          category: acteChoisi ? (acteChoisi.category ?? "OTHER") : category,
          label: libelle,
          clinicalIndication: clinicalIndication.trim() || null,
          urgent,
          catalogItemId: acteChoisi ? acteChoisi.id : null,
        },
        session.token
      );

      setSucces(`Examen demandé : ${libelle}`);
      if (demande) onDemande?.(demande);
      setActeId("");
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
      <div className="sm:col-span-2">
        <Field
          id="examen-acte"
          label="Examen"
          requis
          aide={
            acteChoisi
              ? `${examCategoryLabel(acteChoisi.category)} — tarif : ${montant(acteChoisi.price)}`
              : "Choisissez dans la nomenclature, ou passez en saisie libre pour un acte hors catalogue."
          }
        >
          <select
            id="examen-acte"
            value={acteId}
            onChange={(e) => setActeId(e.target.value)}
            disabled={enCours}
            className={controle()}
          >
            <option value="">Saisie libre (acte hors nomenclature)…</option>
            {actes.map((acte) => (
              <option key={acte.id} value={acte.id}>
                {(acte.label ?? `Acte ${acte.id}`) + " — " + montant(acte.price)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!acteChoisi && (
        <>
          <Field
            id="examen-libelle"
            label="Libellé de l'examen"
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
        </>
      )}

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
