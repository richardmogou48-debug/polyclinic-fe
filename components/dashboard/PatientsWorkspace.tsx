"use client";

import { useState } from "react";
import DirectorySection from "@/components/dashboard/DirectorySection";
import PatientRegistrationForm from "@/components/dashboard/PatientRegistrationForm";
import Modal, { BoutonAction } from "@/components/form/Modal";

/**
 * Liste des patients, et inscription en modale.
 *
 * La modale ne se ferme PAS automatiquement apres un enregistrement reussi : a l'accueil on
 * enchaine les inscriptions, et le formulaire vide avec sa confirmation permet de continuer.
 * C'est l'utilisateur qui decide quand il a fini.
 *
 * Le compteur relie l'ecriture a la lecture : la liste le prend en dependance et se recharge
 * des qu'il change, sinon elle afficherait l'etat d'avant l'enregistrement.
 */
export default function PatientsWorkspace() {
  const [ouverte, setOuverte] = useState(false);
  const [rafraichissements, setRafraichissements] = useState(0);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 id="liste-patients" className="font-heading text-base font-semibold text-secondary-500">
          Patients enregistrés
        </h2>
        <BoutonAction onClick={() => setOuverte(true)}>Enregistrer un patient</BoutonAction>
      </div>

      <section aria-labelledby="liste-patients">
        <DirectorySection annuaire="patients" cleRafraichissement={rafraichissements} />
      </section>

      <Modal ouverte={ouverte} titre="Enregistrer un patient" onFermer={() => setOuverte(false)}>
        <PatientRegistrationForm
          dansModale
          onEnregistre={() => setRafraichissements((n) => n + 1)}
        />
      </Modal>
    </>
  );
}
