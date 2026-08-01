"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fenetre modale, batie sur l'element <dialog> natif.
 *
 * Le natif est prefere a une reimplementation parce qu'il apporte gratuitement ce que les
 * modales maison ratent presque toujours : le piege de focus, la fermeture par Echap, le
 * retour du focus a l'element declencheur, l'inertie du contenu derriere, et `aria-modal`.
 *
 * Deux comportements sont ajoutes par-dessus :
 *
 * - `showModal()` est appele par effet et non au rendu : l'element doit exister dans le DOM
 *   avant, sinon l'appel est sans effet.
 * - La fermeture par clic sur l'arriere-plan est deliberement ABSENTE. Un formulaire a moitie
 *   rempli qu'un clic maladroit efface est une perte de travail ; on ferme par le bouton ou
 *   par Echap, tous deux explicites.
 */
export default function Modal({
  ouverte,
  titre,
  onFermer,
  children,
}: {
  ouverte: boolean;
  titre: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  const reference = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogue = reference.current;
    if (!dialogue) {
      return;
    }
    if (ouverte && !dialogue.open) {
      dialogue.showModal();
    } else if (!ouverte && dialogue.open) {
      dialogue.close();
    }
  }, [ouverte]);

  useEffect(() => {
    const dialogue = reference.current;
    if (!dialogue) {
      return;
    }
    // `cancel` est emis par Echap : on laisse le parent decider, pour que l'etat React et
    // l'etat du DOM ne divergent pas.
    const surAnnulation = (evenement: Event) => {
      evenement.preventDefault();
      onFermer();
    };
    dialogue.addEventListener("cancel", surAnnulation);
    return () => dialogue.removeEventListener("cancel", surAnnulation);
  }, [onFermer]);

  return (
    <dialog
      ref={reference}
      aria-labelledby="titre-modale"
      // `m-auto` est indispensable : <dialog> se centre par le `margin: auto` de la feuille de
      // style du navigateur, que le preflight de Tailwind remet a zero. Sans lui la modale se
      // colle en haut a gauche.
      className="m-auto w-full max-w-2xl rounded-lg border border-neutral-200 bg-white p-0 shadow-card backdrop:bg-secondary-500/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
        <h2 id="titre-modale" className="font-heading text-base font-semibold text-secondary-500">
          {titre}
        </h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="rounded-md px-2 py-1 text-sm text-neutral-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 hover:text-secondary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Fermer
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** Bouton d'ouverture, pour que toutes les actions de creation se ressemblent. */
export function BoutonAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-250 ease-smooth hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      {children}
    </button>
  );
}
