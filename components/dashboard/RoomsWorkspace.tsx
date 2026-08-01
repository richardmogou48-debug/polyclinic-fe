"use client";

import { useState } from "react";
import RoomsSection from "@/components/dashboard/RoomsSection";

/**
 * Etat des chambres, avec les actions d'entretien.
 *
 * Pas de formulaire ici : RoomMS n'expose aucune route pour creer une chambre, un lit ou une
 * categorie. Le parc ne peut aujourd'hui etre constitue qu'en base, ce qui est une lacune du
 * backend et non un ecran manquant. Ce qui se pilote depuis l'interface se limite donc a l'etat
 * d'une chambre existante — nettoyage termine, mise en maintenance —, gestes qui n'ont pas besoin
 * de saisie et se font au clic.
 */
export default function RoomsWorkspace() {
  const [rafraichissements, setRafraichissements] = useState(0);

  return (
    <RoomsSection
      avecActions
      cleRafraichissement={rafraichissements}
      onChangement={() => setRafraichissements((n) => n + 1)}
    />
  );
}
