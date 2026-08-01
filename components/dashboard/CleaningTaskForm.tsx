"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { TYPES_TACHE, planifierNettoyage, type CleaningTaskType } from "@/lib/facilities";

/**
 * Planification d'une tache de nettoyage.
 *
 * Le type n'est pas cosmetique : nettoyage courant, desinfection et sterilisation n'engagent ni
 * les memes produits, ni les memes delais, ni les memes obligations. C'est pourquoi il est
 * contraint et non laisse en texte libre.
 *
 * Le statut n'est pas saisissable — le backend pose PENDING. Une tache creee deja terminee ne
 * prouverait rien sur le nettoyage lui-meme.
 */
type Erreurs = Partial<Record<"lieu" | "date", string>>;

export default function CleaningTaskForm({
  onPlanifie,
  dansModale = false,
}: {
  onPlanifie?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [taskType, setTaskType] = useState<CleaningTaskType>("ROUTINE_CLEANING");
  const [quand, setQuand] = useState("");
  const [notes, setNotes] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees: Erreurs = {};
    if (!location.trim()) trouvees.lieu = "Indiquez le lieu à nettoyer.";
    if (!quand) trouvees.date = "Indiquez la date prévue.";
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await planifierNettoyage(
        {
          location: location.trim(),
          taskType,
          scheduledDate: quand.length === 16 ? `${quand}:00` : quand,
          notes: notes.trim() || null,
        },
        session.token
      );

      setSucces("Tâche planifiée.");
      setLocation("");
      setQuand("");
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
      titre="Planifier un nettoyage"
      dansModale={dansModale}
      actionLibelle="Planifier"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field
        id="nettoyage-lieu"
        label="Lieu"
        requis
        erreur={erreurs.lieu}
        aide="Par exemple : bloc opératoire 2, chambre 104."
      >
        <input
          id="nettoyage-lieu"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.lieu ? true : undefined}
          className={controle(erreurs.lieu)}
        />
      </Field>

      <Field id="nettoyage-type" label="Type d'intervention">
        <select
          id="nettoyage-type"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as CleaningTaskType)}
          disabled={enCours}
          className={controle()}
        >
          {TYPES_TACHE.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field id="nettoyage-date" label="Date et heure prévues" requis erreur={erreurs.date}>
          <input
            id="nettoyage-date"
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
        <Field id="nettoyage-notes" label="Consignes">
          <textarea
            id="nettoyage-notes"
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
