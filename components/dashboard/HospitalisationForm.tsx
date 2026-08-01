"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  admettrePatient,
  fetchRooms,
  libererLit,
  litsDisponibles,
  transfererPatient,
  type CurrentStay,
} from "@/lib/rooms";
import { formatDateTime } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Hospitalisation : admission, transfert et sortie.
 *
 * Les trois gestes tiennent dans un seul ecran parce qu'ils portent sur le meme objet — la place
 * du patient — et que celui qui l'ouvre ne sait pas toujours si le patient est deja hospitalise.
 * C'est le sejour en cours qui decide de ce qui est propose : admettre s'il n'y en a pas,
 * transferer ou faire sortir s'il y en a un. Offrir les trois en permanence permettrait
 * d'admettre un patient deja couche.
 *
 * La sortie ne demande pas de confirmation supplementaire : elle cloture un sejour, ce qui se
 * repare en readmettant le patient, et une confirmation de plus sur un geste quotidien finit par
 * etre validee sans etre lue.
 */
export default function HospitalisationForm({
  patientId,
  nomPatient,
  sejour,
  onChangement,
  dansModale = false,
}: {
  patientId: number;
  nomPatient?: string;
  /** Sejour en cours, s'il y en a un. Son absence bascule l'ecran en admission. */
  sejour?: CurrentStay | null;
  onChangement?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [litChoisi, setLitChoisi] = useState("");
  const [erreurLit, setErreurLit] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const chambres = useAuthenticatedResource((session) => fetchRooms(session.token));

  const enTransfert = Boolean(sejour);

  const executer = async (action: (token: string) => Promise<unknown>, message: string) => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setErreurGlobale(null);
    setSucces(null);
    setEnCours(true);
    try {
      await action(session.token);
      setSucces(message);
      setLitChoisi("");
      onChangement?.();
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

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!litChoisi) {
      setErreurLit(enTransfert ? "Choisissez le lit d'arrivée." : "Choisissez un lit.");
      return;
    }
    setErreurLit(undefined);

    const bedId = Number(litChoisi);

    if (sejour) {
      // L'identifiant du lit d'origine vient du sejour et non d'une saisie : il n'y a pas de
      // raison de laisser choisir d'ou part le patient, et une erreur y libererait le lit d'un
      // autre.
      if (sejour.bedId === null) {
        setErreurGlobale(
          "Le séjour en cours ne mentionne pas de lit : le transfert est impossible. " +
            "Faites sortir le patient puis réadmettez-le."
        );
        return;
      }
      const depart = sejour.bedId;
      await executer(
        (token) => transfererPatient(patientId, depart, bedId, token),
        "Patient transféré."
      );
      return;
    }

    await executer((token) => admettrePatient(bedId, patientId, token), "Patient hospitalisé.");
  };

  const sortie = async () => {
    if (!sejour?.bedId) return;
    const lit = sejour.bedId;
    await executer((token) => libererLit(lit, token), "Sortie enregistrée, le lit est libéré.");
  };

  if (chambres.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des chambres…" />;
  }

  if (chambres.phase === "erreur" || chambres.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Chambres indisponibles"
        description={
          chambres.phase === "erreur"
            ? chambres.message
            : "Les chambres n'ont pas pu être interrogées."
        }
      />
    );
  }

  const libres = litsDisponibles(chambres.donnees).filter((lit) => lit.bedId !== sejour?.bedId);

  return (
    <FormShell
      titre={enTransfert ? "Transférer ou faire sortir" : "Hospitaliser un patient"}
      description={
        nomPatient
          ? enTransfert
            ? `${nomPatient} occupe actuellement un lit.`
            : `Placement de ${nomPatient} dans un lit libre.`
          : undefined
      }
      dansModale={dansModale}
      actionLibelle={enTransfert ? "Transférer" : "Hospitaliser"}
      actionEnCours={enTransfert ? "Transfert…" : "Admission…"}
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      {sejour && (
        <div className="sm:col-span-2 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Séjour en cours
          </p>
          <p className="mt-1 text-sm text-secondary-500">
            Chambre {sejour.roomNumber ?? "?"} — lit {sejour.bedNumber ?? sejour.bedId ?? "?"}
            {sejour.categoryName ? ` (${sejour.categoryName})` : ""}
          </p>
          <p className="mt-0.5 text-sm text-neutral-500">
            Admis le {formatDateTime(sejour.admissionDate)}
          </p>
        </div>
      )}

      <div className="sm:col-span-2">
        <Field
          id="lit"
          label={enTransfert ? "Lit d'arrivée" : "Lit"}
          requis
          erreur={erreurLit}
          aide={
            libres.length === 0
              ? "Aucun lit disponible : les chambres en nettoyage ou en maintenance sont écartées."
              : undefined
          }
        >
          <select
            id="lit"
            value={litChoisi}
            onChange={(e) => setLitChoisi(e.target.value)}
            disabled={enCours || libres.length === 0}
            aria-invalid={erreurLit ? true : undefined}
            className={controle(erreurLit)}
          >
            <option value="">Choisir…</option>
            {libres.map((lit) => (
              <option key={lit.bedId} value={lit.bedId}>
                {lit.libelle}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* La sortie est dans le formulaire mais hors du bouton d'envoi : c'est une action a part,
          pas une variante de l'enregistrement. type="button" l'empeche de soumettre. */}
      {sejour && (
        <div className="sm:col-span-2 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={sortie}
            disabled={enCours}
            className="rounded-md border border-accent-500 px-4 py-2 text-sm font-semibold text-accent-700 transition-colors duration-250 ease-smooth hover:bg-accent-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Faire sortir le patient
          </button>
          <p className="mt-1 text-xs text-neutral-500">
            Clôture le séjour et libère le lit. Le patient pourra être réadmis.
          </p>
        </div>
      )}
    </FormShell>
  );
}
