"use client";

import { useState, type ReactNode } from "react";
import Modal, { BoutonAction } from "@/components/form/Modal";

/**
 * Une liste, un bouton, un formulaire en modale.
 *
 * Ce montage se repetait a l'identique sur chaque ecran de gestion — rendez-vous, factures,
 * incidents, equipements — avec a chaque fois le meme compteur reliant l'ecriture a la lecture.
 * Le factoriser evite qu'un ecran oublie ce compteur et affiche indefiniment l'etat d'avant
 * l'enregistrement, ce qui passe pour une ecriture perdue.
 *
 * La modale ne se ferme PAS apres un enregistrement reussi : sur ces ecrans on enchaine les
 * saisies, et le formulaire vide avec sa confirmation permet de continuer. C'est l'utilisateur
 * qui decide quand il a fini.
 *
 * `formulaire` et `liste` sont des fonctions et non des elements : elles recoivent
 * respectivement de quoi signaler une ecriture et de quoi se recharger. Passer des elements
 * deja construits obligerait chaque appelant a tenir le compteur lui-meme, c'est-a-dire
 * exactement ce qu'on cherche a lui epargner.
 */
export default function EspaceDeTravail({
  titre,
  libelleAction,
  titreModale,
  formulaire,
  liste,
}: {
  titre: string;
  libelleAction: string;
  titreModale: string;
  formulaire: (onEnregistre: () => void) => ReactNode;
  liste: (cleRafraichissement: number) => ReactNode;
}) {
  const [ouverte, setOuverte] = useState(false);
  const [rafraichissements, setRafraichissements] = useState(0);

  const identifiant = `espace-${titre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={identifiant} className="font-heading text-base font-semibold text-secondary-500">
          {titre}
        </h2>
        <BoutonAction onClick={() => setOuverte(true)}>{libelleAction}</BoutonAction>
      </div>

      <section aria-labelledby={identifiant}>{liste(rafraichissements)}</section>

      <Modal ouverte={ouverte} titre={titreModale} onFermer={() => setOuverte(false)}>
        {formulaire(() => setRafraichissements((n) => n + 1))}
      </Modal>
    </>
  );
}
