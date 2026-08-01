"use client";

import type { ReactNode } from "react";

/**
 * Champ de formulaire : etiquette, controle, erreur.
 *
 * L'etiquette est toujours visible et jamais remplacee par un placeholder — un placeholder
 * disparait des qu'on saisit, et l'utilisateur ne sait plus ce qu'il remplit. Le champ requis
 * est marque a la fois par un asterisque et par `required`, pour que l'information existe aussi
 * pour un lecteur d'ecran.
 */
export function Field({
  id,
  label,
  requis,
  erreur,
  aide,
  children,
}: {
  id: string;
  label: string;
  requis?: boolean;
  erreur?: string;
  aide?: string;
  children: ReactNode;
}) {
  const idAide = aide ? `${id}-aide` : undefined;
  const idErreur = erreur ? `${id}-erreur` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-secondary-500">
        {label}
        {requis && (
          <span className="ml-1 text-accent-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {aide && (
        <p id={idAide} className="text-xs text-neutral-500">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={idErreur} role="alert" className="text-xs font-medium text-accent-700">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Classes communes aux controles, pour que tous les formulaires se ressemblent. */
export const CLASSES_CONTROLE =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-secondary-500 outline-none transition-colors duration-250 ease-smooth focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50";

export const CLASSES_CONTROLE_ERREUR =
  "w-full rounded-md border border-accent-500 bg-white px-3 py-2 text-sm text-secondary-500 outline-none transition-colors duration-250 ease-smooth focus:border-accent-500 focus:ring-1 focus:ring-accent-500 disabled:cursor-not-allowed disabled:bg-neutral-50";

export const controle = (erreur?: string) => (erreur ? CLASSES_CONTROLE_ERREUR : CLASSES_CONTROLE);
