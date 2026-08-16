"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { montant } from "@/lib/billing";
import {
  EXAM_CATEGORY_LABELS,
  creerActeCatalogue,
  examCategoryLabel,
  fetchExamCatalog,
  majActeCatalogue,
  type ExamCatalogItem,
  type ExamCategory,
} from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Nomenclature tarifaire des examens, vue de l'administration.
 *
 * C'est ici que le metier ajuste un tarif : le prix se modifie en place, ligne par ligne, et
 * s'applique aux facturations suivantes — il est lu au moment de facturer, jamais fige a la
 * demande. Un acte ne se supprime pas, il se retire : des demandes passees le referencent.
 */
const CATEGORIES = Object.entries(EXAM_CATEGORY_LABELS) as [ExamCategory, string][];

const BOUTON_SECONDAIRE =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-secondary-500 " +
  "transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60";

export default function ExamCatalogSection() {
  const router = useRouter();

  const [rafraichissements, setRafraichissements] = useState(0);
  // Tarifs en cours d'edition, par acte. Absent = la valeur servie par le backend.
  const [tarifs, setTarifs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "creation" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const [nouveauLibelle, setNouveauLibelle] = useState("");
  const [nouvelleCategorie, setNouvelleCategorie] = useState<ExamCategory>("BIOLOGY");
  const [nouveauTarif, setNouveauTarif] = useState("");

  const catalogue = useAuthenticatedResource(
    (session) => fetchExamCatalog(session.token, true),
    [rafraichissements]
  );

  if (catalogue.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement de la nomenclature…" />;
  }
  if (catalogue.phase === "erreur") {
    return <SectionMessage variant="error" title="Nomenclature indisponible" description={catalogue.message} />;
  }
  if (catalogue.phase === "impossible") {
    return <SectionMessage variant="error" title="Nomenclature indisponible" />;
  }

  const actes = catalogue.donnees;

  const executer = async (cle: number | "creation", action: (token: string) => Promise<void>) => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setErreur(null);
    setSucces(null);
    setEnCours(cle);
    try {
      await action(session.token);
      setRafraichissements((n) => n + 1);
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreur(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(null);
    }
  };

  const lireTarif = (saisie: string): number | null => {
    const valeur = Number(saisie.replace(",", "."));
    return Number.isFinite(valeur) && valeur >= 0 ? valeur : null;
  };

  const enregistrerTarif = (acte: ExamCatalogItem) => {
    const saisie = tarifs[acte.id];
    const valeur = lireTarif(saisie ?? "");
    if (saisie === undefined || valeur === null) {
      setErreur("Le tarif doit être un montant positif ou nul.");
      return;
    }
    void executer(acte.id, async (token) => {
      await majActeCatalogue(
        acte.id,
        {
          label: acte.label ?? "",
          category: acte.category ?? "OTHER",
          price: valeur,
          active: acte.active,
        },
        token
      );
      setTarifs(({ [acte.id]: _oublie, ...restants }) => restants);
      setSucces(`Tarif enregistré : ${acte.label} à ${montant(valeur)}.`);
    });
  };

  const basculerActif = (acte: ExamCatalogItem) =>
    void executer(acte.id, async (token) => {
      await majActeCatalogue(
        acte.id,
        {
          label: acte.label ?? "",
          category: acte.category ?? "OTHER",
          price: acte.price ?? 0,
          active: !acte.active,
        },
        token
      );
      setSucces(acte.active ? `Acte retiré : ${acte.label}.` : `Acte réactivé : ${acte.label}.`);
    });

  const ajouterActe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valeur = lireTarif(nouveauTarif);
    if (!nouveauLibelle.trim() || valeur === null) {
      setErreur("Un nouvel acte demande un libellé et un tarif positif ou nul.");
      return;
    }
    void executer("creation", async (token) => {
      await creerActeCatalogue(
        { label: nouveauLibelle.trim(), category: nouvelleCategorie, price: valeur },
        token
      );
      setSucces(`Acte ajouté : ${nouveauLibelle.trim()} à ${montant(valeur)}.`);
      setNouveauLibelle("");
      setNouveauTarif("");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {erreur && (
        <p role="alert" className="rounded-md bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700">
          {erreur}
        </p>
      )}
      {succes && (
        <p role="status" className="rounded-md bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
          {succes}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Nomenclature des examens et tarifs</caption>
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Acte</th>
              <th scope="col" className="px-4 py-3 font-medium">Nature</th>
              <th scope="col" className="px-4 py-3 font-medium">Tarif (FCFA)</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {actes.map((acte) => (
              <tr
                key={acte.id}
                className={
                  "transition-colors duration-250 ease-smooth hover:bg-neutral-50" +
                  (acte.active ? "" : " opacity-50")
                }
              >
                <td className="px-5 py-3 font-medium text-secondary-500">
                  {acte.label ?? `Acte ${acte.id}`}
                  {!acte.active && (
                    <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600">
                      Retiré
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                  {examCategoryLabel(acte.category)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={`Tarif de ${acte.label ?? `l'acte ${acte.id}`}`}
                    value={tarifs[acte.id] ?? String(acte.price ?? "")}
                    onChange={(e) => setTarifs((t) => ({ ...t, [acte.id]: e.target.value }))}
                    disabled={enCours !== null}
                    className={controle() + " w-28"}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => enregistrerTarif(acte)}
                      disabled={enCours !== null || tarifs[acte.id] === undefined}
                      className={BOUTON_SECONDAIRE}
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => basculerActif(acte)}
                      disabled={enCours !== null}
                      className={BOUTON_SECONDAIRE}
                    >
                      {acte.active ? "Retirer" : "Réactiver"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={ajouterActe}
        className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <Field id="acte-libelle" label="Nouvel acte" requis>
          <input
            id="acte-libelle"
            type="text"
            placeholder="Échographie rénale"
            value={nouveauLibelle}
            onChange={(e) => setNouveauLibelle(e.target.value)}
            disabled={enCours !== null}
            className={controle()}
          />
        </Field>
        <Field id="acte-categorie" label="Nature">
          <select
            id="acte-categorie"
            value={nouvelleCategorie}
            onChange={(e) => setNouvelleCategorie(e.target.value as ExamCategory)}
            disabled={enCours !== null}
            className={controle()}
          >
            {CATEGORIES.map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
        </Field>
        <Field id="acte-tarif" label="Tarif (FCFA)" requis>
          <input
            id="acte-tarif"
            type="text"
            inputMode="numeric"
            value={nouveauTarif}
            onChange={(e) => setNouveauTarif(e.target.value)}
            disabled={enCours !== null}
            className={controle()}
          />
        </Field>
        <div className="flex items-end">
          <button type="submit" disabled={enCours !== null} className={BOUTON_SECONDAIRE}>
            {enCours === "creation" ? "Ajout…" : "Ajouter l'acte"}
          </button>
        </div>
      </form>
    </div>
  );
}
