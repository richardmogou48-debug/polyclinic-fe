"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { fetchAllPatients } from "@/lib/profiles";
import { CATEGORIES_RECLAMATION, declarerReclamation, type ComplaintCategory } from "@/lib/quality";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Enregistrement d'une reclamation.
 *
 * Le patient est FACULTATIF, et c'est voulu : une reclamation anonyme reste une reclamation, et
 * exiger de nommer le plaignant ferait taire ceux qui craignent pour la suite de leur prise en
 * charge. Le rattachement sert quand il est connu, il ne conditionne pas l'enregistrement.
 */
export default function ComplaintForm({
  onDeclare,
  dansModale = false,
}: {
  onDeclare?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("MEDICAL_CARE");
  const [description, setDescription] = useState("");

  const [erreurDescription, setErreurDescription] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const patients = useAuthenticatedResource((session) => fetchAllPatients(session.token));
  const listePatients = patients.phase === "pret" ? patients.donnees : [];

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    if (!description.trim()) {
      setErreurDescription("Décrivez l'objet de la réclamation.");
      return;
    }
    setErreurDescription(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await declarerReclamation(
        {
          patientId: patientId ? Number(patientId) : null,
          category,
          description: description.trim(),
        },
        session.token
      );

      setSucces("Réclamation enregistrée.");
      setPatientId("");
      setCategory("MEDICAL_CARE");
      setDescription("");
      onDeclare?.();
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
      titre="Enregistrer une réclamation"
      dansModale={dansModale}
      actionLibelle="Enregistrer"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field
        id="reclamation-patient"
        label="Patient concerné"
        aide="Facultatif : une réclamation anonyme reste recevable."
      >
        <select
          id="reclamation-patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          disabled={enCours}
          className={controle()}
        >
          <option value="">Non précisé</option>
          {listePatients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name ?? `Patient ${patient.id}`}
            </option>
          ))}
        </select>
      </Field>

      <Field id="reclamation-categorie" label="Catégorie">
        <select
          id="reclamation-categorie"
          value={category}
          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
          disabled={enCours}
          className={controle()}
        >
          {CATEGORIES_RECLAMATION.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field id="reclamation-description" label="Objet" requis erreur={erreurDescription}>
          <textarea
            id="reclamation-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurDescription ? true : undefined}
            className={controle(erreurDescription)}
          />
        </Field>
      </div>
    </FormShell>
  );
}
