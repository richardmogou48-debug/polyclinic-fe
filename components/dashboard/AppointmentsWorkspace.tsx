"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import AppointmentForm from "@/components/dashboard/AppointmentForm";
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
export default function AppointmentsWorkspace() {
  return (
    <EspaceDeTravail
      titre="Rendez-vous"
      libelleAction="Planifier un rendez-vous"
      titreModale="Planifier un rendez-vous"
      formulaire={(fait) => <AppointmentForm dansModale onPlanifie={fait} />}
      liste={(cle) => <DirectorySection annuaire="rendez-vous" cleRafraichissement={cle} />}
    />
  );
}
