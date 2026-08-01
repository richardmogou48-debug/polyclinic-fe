"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import MedicineForm from "@/components/dashboard/MedicineForm";
import MedicinesSection from "@/components/dashboard/MedicinesSection";

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
export default function MedicinesWorkspace() {
  return (
    <EspaceDeTravail
      titre="Médicaments référencés"
      libelleAction="Référencer un médicament"
      titreModale="Référencer un médicament"
      formulaire={(fait) => <MedicineForm dansModale onEnregistre={fait} />}
      liste={(cle) => <MedicinesSection cleRafraichissement={cle} />}
    />
  );
}
