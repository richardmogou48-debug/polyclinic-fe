"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { rendreResultat } from "@/lib/consultations";

/**
 * Resultat d'un examen.
 *
 * L'enregistrement bascule la demande a COMPLETED — c'est le seul geste qui la fait basculer — et
 * leve du meme coup le verrou sur la prescription de medicaments. Un second resultat est refuse
 * par le backend : une correction se fait sur le resultat existant, pour qu'il n'y ait jamais
 * deux versions concurrentes a departager.
 *
 * « Hors normes » est declare, jamais deduit. Les valeurs de reference dependent de l'age, du
 * sexe, du laboratoire et de la technique ; les calculer ici produirait de fausses alertes sur un
 * dossier medical, ce qui est pire que pas d'alerte du tout.
 */
export default function ExamResultForm({
  examId,
  libelleExamen,
  onRendu,
  dansModale = false,
}: {
  examId: number;
  libelleExamen?: string;
  onRendu?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [abnormal, setAbnormal] = useState(false);

  const [erreurContenu, setErreurContenu] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [rendu, setRendu] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    // Le backend accepte les deux champs vides ; l'interface non. Un resultat sans contenu
    // marquerait l'examen comme rendu et debloquerait la prescription sans rien apporter au
    // medecin — exactement ce que la regle cherche a eviter.
    if (!findings.trim() && !conclusion.trim()) {
      setErreurContenu("Renseignez au moins les mesures ou la conclusion.");
      return;
    }
    setErreurContenu(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await rendreResultat(
        examId,
        {
          findings: findings.trim() || null,
          conclusion: conclusion.trim() || null,
          abnormal,
        },
        session.token
      );

      setSucces("Résultat enregistré. Le traitement peut être prescrit.");
      // Le formulaire ne se vide pas et se verrouille : l'examen a rendu, il ne peut plus rien
      // recevoir. Le rouvrir vide inviterait a une seconde saisie que le backend refusera.
      setRendu(true);
      onRendu?.();
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

  const fige = enCours || rendu;

  return (
    <FormShell
      titre="Rendre un résultat"
      description={
        libelleExamen
          ? `${libelleExamen}. Un seul résultat par examen : une correction se fait sur celui-ci.`
          : "Un seul résultat par examen : une correction se fait sur celui-ci."
      }
      dansModale={dansModale}
      actionLibelle="Enregistrer le résultat"
      actionEnCours="Enregistrement…"
      enCours={fige}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <div className="sm:col-span-2">
        <Field
          id="resultat-mesures"
          label="Mesures et observations"
          erreur={erreurContenu}
          aide="Ce qui est mesuré ou observé : valeurs, description de l'image."
        >
          <textarea
            id="resultat-mesures"
            rows={3}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            disabled={fige}
            aria-invalid={erreurContenu ? true : undefined}
            className={controle(erreurContenu)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field
          id="resultat-conclusion"
          label="Conclusion"
          aide="Ce qu'il faut en retenir. La valeur brute et sa lecture ne sont pas la même chose."
        >
          <textarea
            id="resultat-conclusion"
            rows={2}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            disabled={fige}
            className={controle()}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-secondary-500">
          <input
            type="checkbox"
            checked={abnormal}
            onChange={(e) => setAbnormal(e.target.checked)}
            disabled={fige}
            className="h-4 w-4 rounded border-neutral-300 text-accent-500 focus:ring-accent-500"
          />
          Résultat hors normes
        </label>
      </div>
    </FormShell>
  );
}
