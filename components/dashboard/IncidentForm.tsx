"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { GRAVITES, declarerIncident, type Severity } from "@/lib/quality";

/**
 * Declaration d'un incident.
 *
 * Ouverte largement — medecin, secretaire, responsable qualite, administration — parce qu'un
 * incident se declare par celui qui l'a vu. Le reserver au responsable qualite garantirait
 * qu'une partie des incidents ne remonte jamais.
 *
 * La date de l'incident se saisit et n'est pas celle du signalement : les deux different
 * presque toujours, et les confondre rend impossible de mesurer le delai de remontee.
 */
type Erreurs = Partial<Record<"date" | "location" | "description", string>>;

export default function IncidentForm({
  onDeclare,
  dansModale = false,
}: {
  onDeclare?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [quand, setQuand] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<Severity>("MEDIUM");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees: Erreurs = {};
    if (!quand) trouvees.date = "Indiquez quand l'incident s'est produit.";
    if (!location.trim()) trouvees.location = "Indiquez le lieu.";
    if (!description.trim()) trouvees.description = "Décrivez ce qui s'est passé.";
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await declarerIncident(
        {
          incidentDate: quand.length === 16 ? `${quand}:00` : quand,
          location: location.trim(),
          severity,
          description: description.trim(),
          immediateActionTaken: action.trim() || null,
        },
        session.token
      );

      setSucces("Incident déclaré.");
      setQuand("");
      setLocation("");
      setSeverity("MEDIUM");
      setDescription("");
      setAction("");
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
      titre="Déclarer un incident"
      description="Déclarez ce que vous avez constaté, même sans certitude sur les causes."
      dansModale={dansModale}
      actionLibelle="Déclarer l'incident"
      actionEnCours="Envoi…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field
        id="incident-date"
        label="Date et heure de l'incident"
        requis
        erreur={erreurs.date}
        aide="Celle des faits, pas celle du signalement."
      >
        <input
          id="incident-date"
          type="datetime-local"
          value={quand}
          onChange={(e) => setQuand(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.date ? true : undefined}
          className={controle(erreurs.date)}
        />
      </Field>

      <Field id="incident-gravite" label="Gravité">
        <select
          id="incident-gravite"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity)}
          disabled={enCours}
          className={controle()}
        >
          {GRAVITES.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="incident-lieu"
          label="Lieu"
          requis
          erreur={erreurs.location}
          aide="Par exemple : bloc opératoire, chambre 203, pharmacie."
        >
          <input
            id="incident-lieu"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.location ? true : undefined}
            className={controle(erreurs.location)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field id="incident-description" label="Description" requis erreur={erreurs.description}>
          <textarea
            id="incident-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.description ? true : undefined}
            className={controle(erreurs.description)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field
          id="incident-action"
          label="Mesure immédiate prise"
          aide="Ce qui a été fait sur le moment, avant toute analyse."
        >
          <textarea
            id="incident-action"
            rows={2}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            disabled={enCours}
            className={controle()}
          />
        </Field>
      </div>
    </FormShell>
  );
}
