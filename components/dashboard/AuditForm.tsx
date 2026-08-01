"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { cloturerAudit, planifierAudit, type InternalAudit } from "@/lib/quality";

/**
 * Audit interne : planification, ou cloture d'un audit deja planifie.
 *
 * Les deux gestes sont dans le meme composant parce qu'ils portent sur le meme objet, mais ils
 * n'ouvrent JAMAIS les memes champs : on planifie un audit sans en connaitre le resultat, et on
 * le cloture sans redefinir ce qu'on est venu auditer. C'est la presence d'un audit en entree qui
 * decide, pas un choix de l'utilisateur.
 *
 * A la cloture, le backend exige la note, les constats ET les actions correctives. Une note sans
 * justification ne se defend pas devant un inspecteur, et c'est pourquoi les trois sont requis
 * ici aussi plutot que de laisser le serveur refuser sans explication.
 */
type Erreurs = Partial<Record<"titre" | "service" | "date" | "note" | "constats" | "actions", string>>;

export default function AuditForm({
  audit,
  onEnregistre,
  dansModale = false,
}: {
  /** Present : on cloture cet audit. Absent : on en planifie un nouveau. */
  audit?: InternalAudit | null;
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [auditDate, setAuditDate] = useState("");

  const [score, setScore] = useState("");
  const [findings, setFindings] = useState("");
  const [actions, setActions] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const cloture = Boolean(audit);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees: Erreurs = {};

    if (cloture) {
      const note = Number(score);
      if (!score.trim() || !Number.isInteger(note) || note < 0 || note > 100) {
        trouvees.note = "La note est un entier entre 0 et 100.";
      }
      if (!findings.trim()) trouvees.constats = "Les constats sont obligatoires.";
      if (!actions.trim()) trouvees.actions = "Les actions correctives sont obligatoires.";
    } else {
      if (!title.trim()) trouvees.titre = "Donnez un objet à l'audit.";
      if (!department.trim()) trouvees.service = "Indiquez le service audité.";
      if (!auditDate) trouvees.date = "Indiquez la date prévue.";
    }

    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      if (audit) {
        await cloturerAudit(audit.id, Number(score), findings.trim(), actions.trim(), session.token);
        setSucces("Audit clôturé.");
      } else {
        await planifierAudit(
          { auditDate, department: department.trim(), title: title.trim() },
          session.token
        );
        setSucces("Audit planifié.");
        setTitle("");
        setDepartment("");
        setAuditDate("");
      }
      onEnregistre?.();
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
      titre={cloture ? "Clôturer l'audit" : "Planifier un audit"}
      description={
        cloture
          ? "La note seule ne suffit pas : constats et actions correctives sont exigés."
          : undefined
      }
      dansModale={dansModale}
      actionLibelle={cloture ? "Clôturer l'audit" : "Planifier"}
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      {audit ? (
        <>
          <div className="sm:col-span-2 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-sm font-medium text-secondary-500">{audit.title ?? "Audit"}</p>
            <p className="mt-0.5 text-sm text-neutral-500">
              {audit.department ?? "Service non précisé"} · prévu le {audit.auditDate ?? "—"}
            </p>
          </div>

          <Field id="audit-note" label="Note sur 100" requis erreur={erreurs.note}>
            <input
              id="audit-note"
              type="number"
              min={0}
              max={100}
              step={1}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              disabled={enCours}
              aria-invalid={erreurs.note ? true : undefined}
              className={controle(erreurs.note)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="audit-constats" label="Constats" requis erreur={erreurs.constats}>
              <textarea
                id="audit-constats"
                rows={3}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                disabled={enCours}
                aria-invalid={erreurs.constats ? true : undefined}
                className={controle(erreurs.constats)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field id="audit-actions" label="Actions correctives" requis erreur={erreurs.actions}>
              <textarea
                id="audit-actions"
                rows={3}
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                disabled={enCours}
                aria-invalid={erreurs.actions ? true : undefined}
                className={controle(erreurs.actions)}
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <div className="sm:col-span-2">
            <Field id="audit-titre" label="Objet de l'audit" requis erreur={erreurs.titre}>
              <input
                id="audit-titre"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={enCours}
                aria-invalid={erreurs.titre ? true : undefined}
                className={controle(erreurs.titre)}
              />
            </Field>
          </div>

          <Field
            id="audit-service"
            label="Service audité"
            requis
            erreur={erreurs.service}
            aide="Par exemple : pharmacie, bloc opératoire, accueil."
          >
            <input
              id="audit-service"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={enCours}
              aria-invalid={erreurs.service ? true : undefined}
              className={controle(erreurs.service)}
            />
          </Field>

          <Field id="audit-date" label="Date prévue" requis erreur={erreurs.date}>
            <input
              id="audit-date"
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              disabled={enCours}
              aria-invalid={erreurs.date ? true : undefined}
              className={controle(erreurs.date)}
            />
          </Field>
        </>
      )}
    </FormShell>
  );
}
