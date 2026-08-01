"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import EquipmentForm from "@/components/dashboard/EquipmentForm";
import FacilitiesSection from "@/components/dashboard/FacilitiesSection";

/**
 * Composant client interpose entre la page et EspaceDeTravail.
 *
 * Il ne semble rien faire, et pourtant il est indispensable : EspaceDeTravail recoit ses deux
 * contenus sous forme de FONCTIONS, et React interdit de passer une fonction d'un composant
 * serveur a un composant client — elle n'est pas serialisable. Sans cet intermediaire, la page
 * echouerait au rendu.
 *
 * Le garder permet aux pages de rester des composants serveur, ce qu'elles sont toutes ici.
 */
export default function EquipmentWorkspace() {
  return (
    <EspaceDeTravail
      titre="Parc d'équipements"
      libelleAction="Enregistrer un équipement"
      titreModale="Enregistrer un équipement"
      formulaire={(fait) => <EquipmentForm dansModale onEnregistre={fait} />}
      liste={(cle) => <FacilitiesSection registre="equipements" cleRafraichissement={cle} />}
    />
  );
}
