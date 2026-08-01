"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { RoleConfig } from "@/lib/navigation";
import NavList from "@/components/dashboard/NavList";

/**
 * Navigation des petits ecrans : une barre superieure, et un tiroir.
 *
 * Le tiroir est un <dialog> et non une div positionnee, pour la meme raison que la modale des
 * formulaires : le natif apporte le piege de focus, la fermeture par Echap, le retour du focus au
 * bouton et l'inertie du contenu derriere — quatre choses qu'un menu maison rate presque toujours,
 * et dont l'absence se paie surtout ici, ou l'on navigue au clavier ou au lecteur d'ecran.
 *
 * Il se ferme au clic sur un lien. Sans cela, la page changerait derriere un menu reste ouvert,
 * et il faudrait un second geste pour decouvrir qu'on est arrive.
 */
export default function MobileNav({ config }: { config: RoleConfig }) {
  const [ouvert, setOuvert] = useState(false);
  const reference = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const tiroir = reference.current;
    if (!tiroir) {
      return;
    }
    if (ouvert && !tiroir.open) {
      tiroir.showModal();
    } else if (!ouvert && tiroir.open) {
      tiroir.close();
    }
  }, [ouvert]);

  useEffect(() => {
    const tiroir = reference.current;
    if (!tiroir) {
      return;
    }
    // Echap emet « cancel » : on laisse l'etat React decider, sinon le DOM se ferme sans que le
    // composant le sache et le bouton devient sans effet au clic suivant.
    const surAnnulation = (evenement: Event) => {
      evenement.preventDefault();
      setOuvert(false);
    };
    tiroir.addEventListener("cancel", surAnnulation);
    return () => tiroir.removeEventListener("cancel", surAnnulation);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-secondary-200/10 bg-secondary-950 px-4 py-3 text-neutral-50 lg:hidden">
        <div className="flex items-center gap-3">
          <Image
            src="/logo_polyclinic.png"
            alt="Polyclinique Fultang"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold">Polyclinique Fultang</p>
            <p className="text-xs text-neutral-400">{config.label}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-expanded={ouvert}
          aria-label="Ouvrir le menu"
          className="rounded-md border border-neutral-50/20 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Menu
        </button>
      </header>

      {/* `mr-auto` colle le tiroir a gauche : le preflight de Tailwind remet a zero le margin que
          le navigateur applique a <dialog>, sans quoi il s'afficherait centre. */}
      <dialog
        ref={reference}
        aria-label="Navigation"
        className="m-0 mr-auto h-full max-h-none w-72 max-w-[85vw] bg-secondary-950 p-0 text-neutral-50 backdrop:bg-secondary-950/60 lg:hidden"
      >
        {ouvert && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-secondary-200/10 px-4 py-4">
              <p className="font-heading text-sm font-semibold">{config.label}</p>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:bg-secondary-900 hover:text-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Fermer
              </button>
            </div>

            <NavList config={config} onNavigation={() => setOuvert(false)} />
          </div>
        )}
      </dialog>
    </>
  );
}
