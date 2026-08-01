"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  STATUTS_EQUIPEMENT,
  TYPES_MAINTENANCE,
  changerStatutEquipement,
  consignerMaintenance,
  deplacerEquipement,
  type Equipment,
  type EquipmentStatus,
  type MaintenanceType,
} from "@/lib/facilities";

/**
 * Vie d'un equipement : intervention, changement d'etat, deplacement.
 *
 * Trois routes distinctes reunies sur un ecran, parce qu'elles se declenchent au meme moment —
 * le technicien qui intervient constate aussi que l'appareil repart, ou non, et souvent qu'il a
 * change de salle. Les separer ferait ouvrir trois ecrans pour un seul passage.
 *
 * « Intervention resolue » est une case a part et non une deduction du statut : une maintenance
 * peut echouer, et c'est justement ce qu'il faut pouvoir suivre. Un appareil remis ACTIVE apres
 * une intervention infructueuse serait une double erreur, mais le systeme ne peut pas le savoir
 * a la place de celui qui etait devant.
 */
export default function MaintenanceForm({
  equipement,
  onEnregistre,
  dansModale = false,
}: {
  equipement: Equipment;
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [type, setType] = useState<MaintenanceType>("CURATIVE");
  const [description, setDescription] = useState("");
  const [cout, setCout] = useState("");
  const [resolue, setResolue] = useState(true);

  const [statut, setStatut] = useState<EquipmentStatus>(equipement.status ?? "ACTIVE");
  const [lieu, setLieu] = useState(equipement.currentLocation ?? "");

  const [erreurDescription, setErreurDescription] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

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

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!description.trim()) {
      setErreurDescription("Décrivez l'intervention.");
      return;
    }
    setErreurDescription(undefined);

    const montant = cout.trim() ? Number(cout.trim().replace(",", ".")) : null;
    if (montant !== null && (!Number.isFinite(montant) || montant < 0)) {
      setErreurGlobale("Le coût doit être un nombre positif.");
      return;
    }

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    await executer(
      (token) =>
        consignerMaintenance(
          equipement.id,
          {
            type,
            performedBy: session.name || null,
            description: description.trim(),
            cost: montant,
            successfullyResolved: resolue,
          },
          token
        ),
      "Intervention consignée."
    );
    setDescription("");
    setCout("");
  };

  return (
    <FormShell
      titre="Consigner une intervention"
      description={`${equipement.name ?? "Équipement"} — n° de série ${equipement.serialNumber ?? "inconnu"}`}
      dansModale={dansModale}
      actionLibelle="Consigner l'intervention"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field id="maintenance-type" label="Nature">
        <select
          id="maintenance-type"
          value={type}
          onChange={(e) => setType(e.target.value as MaintenanceType)}
          disabled={enCours}
          className={controle()}
        >
          {TYPES_MAINTENANCE.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <Field id="maintenance-cout" label="Coût (FCFA)">
        <input
          id="maintenance-cout"
          type="text"
          inputMode="numeric"
          value={cout}
          onChange={(e) => setCout(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field id="maintenance-description" label="Description" requis erreur={erreurDescription}>
          <textarea
            id="maintenance-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurDescription ? true : undefined}
            className={controle(erreurDescription)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-secondary-500">
          <input
            type="checkbox"
            checked={resolue}
            onChange={(e) => setResolue(e.target.checked)}
            disabled={enCours}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          L&apos;intervention a résolu le problème
        </label>
      </div>

      {/* Deux autres routes, hors du bouton d'envoi : elles ne font pas partie de l'intervention
          consignee, meme si elles se decident au meme moment. */}
      <div className="sm:col-span-2 grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
        <Field id="maintenance-statut" label="État de l'équipement">
          <div className="flex gap-2">
            <select
              id="maintenance-statut"
              value={statut}
              onChange={(e) => setStatut(e.target.value as EquipmentStatus)}
              disabled={enCours}
              className={controle()}
            >
              {STATUTS_EQUIPEMENT.map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                executer(
                  (token) => changerStatutEquipement(equipement.id, statut, token),
                  "État mis à jour."
                )
              }
              disabled={enCours}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Appliquer
            </button>
          </div>
        </Field>

        <Field id="maintenance-lieu" label="Emplacement">
          <div className="flex gap-2">
            <input
              id="maintenance-lieu"
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              disabled={enCours}
              className={controle()}
            />
            <button
              type="button"
              onClick={() =>
                lieu.trim()
                  ? executer(
                      (token) => deplacerEquipement(equipement.id, lieu.trim(), token),
                      "Emplacement mis à jour."
                    )
                  : setErreurGlobale("Indiquez un emplacement avant de le déplacer.")
              }
              disabled={enCours}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Déplacer
            </button>
          </div>
        </Field>
      </div>
    </FormShell>
  );
}
