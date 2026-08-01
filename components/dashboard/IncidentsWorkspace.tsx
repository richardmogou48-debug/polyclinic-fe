"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import IncidentForm from "@/components/dashboard/IncidentForm";
import QualitySection from "@/components/dashboard/QualitySection";

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
export default function IncidentsWorkspace() {
  return (
    <EspaceDeTravail
      titre="Incidents déclarés"
      libelleAction="Déclarer un incident"
      titreModale="Déclarer un incident"
      formulaire={(fait) => <IncidentForm dansModale onDeclare={fait} />}
      liste={(cle) => <QualitySection registre="incident" cleRafraichissement={cle} />}
    />
  );
}
