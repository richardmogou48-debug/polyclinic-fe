"use client";

import EspaceDeTravail from "@/components/dashboard/EspaceDeTravail";
import InvoiceForm from "@/components/dashboard/InvoiceForm";
import InvoicesSection from "@/components/dashboard/InvoicesSection";

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
export default function BillingWorkspace() {
  return (
    <EspaceDeTravail
      titre="Factures"
      libelleAction="Ouvrir une facture"
      titreModale="Ouvrir une facture"
      formulaire={(fait) => <InvoiceForm dansModale onCreee={fait} />}
      liste={(cle) => <InvoicesSection portee="globale" cleRafraichissement={cle} />}
    />
  );
}
