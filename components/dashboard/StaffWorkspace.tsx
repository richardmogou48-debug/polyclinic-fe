"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import StaffForm from "@/components/dashboard/StaffForm";
import DirectorySection from "@/components/dashboard/DirectorySection";

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
export default function StaffWorkspace() {
  return (
    <EspaceDeTravail
      titre="Personnel"
      libelleAction="Créer un compte"
      titreModale="Créer un compte de personnel"
      formulaire={(fait) => <StaffForm dansModale onCree={fait} />}
      liste={(cle) => <DirectorySection annuaire="personnel" cleRafraichissement={cle} />}
    />
  );
}
