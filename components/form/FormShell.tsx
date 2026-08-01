"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * Enveloppe commune aux formulaires : titre, message global, bouton, etat de soumission.
 *
 * Le bouton dit exactement ce qui va se passer (« Enregistrer le patient », pas « Valider ») et
 * le message de succes le confirme au passe (« Patient enregistre »). Un libelle generique
 * oblige l'utilisateur a se souvenir de ce qu'il etait en train de faire.
 */
export default function FormShell({
  titre,
  description,
  actionLibelle,
  actionEnCours,
  enCours,
  erreur,
  succes,
  onSubmit,
  dansModale = false,
  children,
}: {
  /** Ignore quand `dansModale` : la modale porte deja le titre, le repeter serait bruyant. */
  titre?: string;
  description?: string;
  /** Ce que fait le bouton, a l'infinitif : « Enregistrer le patient ». */
  actionLibelle: string;
  /** Le meme, pendant l'envoi : « Enregistrement… ». */
  actionEnCours: string;
  enCours: boolean;
  erreur?: string | null;
  succes?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Dans une modale : ni cadre ni titre propres, la modale les fournit deja. */
  dansModale?: boolean;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      // noValidate : la validation est faite en TypeScript pour que les messages soient les
      // notres et en francais, plutot que ceux du navigateur, qui varient selon la langue du
      // systeme et ne peuvent pas dire « ce patient existe deja ».
      noValidate
      className={dansModale ? "" : "max-w-2xl rounded-lg border border-neutral-200 bg-white"}
    >
      {!dansModale && (
        <header className="border-b border-neutral-200 px-5 py-4">
          <h2 className="font-heading text-base font-semibold text-secondary-500">{titre}</h2>
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </header>
      )}

      {dansModale && description && (
        <p className="px-5 pt-4 text-sm text-neutral-500">{description}</p>
      )}

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">{children}</div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-neutral-200 px-5 py-4">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-250 ease-smooth hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? actionEnCours : actionLibelle}
        </button>

        {/* role="alert" sur les deux : un envoi qui reussit ou echoue sans etre annonce laisse
            l'utilisateur d'un lecteur d'ecran devant un formulaire qui n'a rien fait de visible. */}
        {erreur && (
          <p role="alert" className="text-sm font-medium text-accent-700">
            {erreur}
          </p>
        )}
        {succes && (
          <p role="alert" className="text-sm font-medium text-primary-700">
            {succes}
          </p>
        )}
      </footer>
    </form>
  );
}
