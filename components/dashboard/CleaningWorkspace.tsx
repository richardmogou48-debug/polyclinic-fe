"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import CleaningTaskForm from "@/components/dashboard/CleaningTaskForm";
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
export default function CleaningWorkspace() {
  return (
    <EspaceDeTravail
      titre="Tâches de nettoyage"
      libelleAction="Planifier un nettoyage"
      titreModale="Planifier un nettoyage"
      formulaire={(fait) => <CleaningTaskForm dansModale onPlanifie={fait} />}
      liste={(cle) => <FacilitiesSection registre="nettoyage" cleRafraichissement={cle} />}
    />
  );
}
