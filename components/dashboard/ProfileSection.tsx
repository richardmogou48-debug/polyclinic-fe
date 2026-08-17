"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import {
  champsMedecin,
  champsPatient,
  champsPersonnel,
  fetchDoctorProfile,
  fetchPatientProfile,
  fetchStaffProfile,
  typeDeFiche,
  type ChampProfil,
  type DoctorProfile,
  type PatientProfile,
  type StaffProfile,
} from "@/lib/profiles";

/**
 * Fiche de l'utilisateur connecte.
 *
 * Un seul composant pour les sept tableaux de bord qui affichent « Mon profil » : c'est le role
 * de la session qui decide de la fiche a interroger, l'ecran n'a rien a parametrer.
 */
type Fiche = DoctorProfile | PatientProfile | StaffProfile;

export default function ProfileSection() {
  const etat = useAuthenticatedResource<{ type: "doctor" | "patient" | "staff"; fiche: Fiche }>(
    (session) => {
      const type = typeDeFiche(session.role);
      // ADMIN n'a pas de fiche, et un compte cree directement en base n'a pas de profileId.
      if (type === null || !session.profileId) {
        return null;
      }
      const id = Number(session.profileId);
      if (type === "doctor") {
        return fetchDoctorProfile(id, session.token).then((fiche) => ({ type, fiche }));
      }
      if (type === "patient") {
        return fetchPatientProfile(id, session.token).then((fiche) => ({ type, fiche }));
      }
      return fetchStaffProfile(id, session.token).then((fiche) => ({ type, fiche }));
    },
    []
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement de votre fiche…" />;
  }

  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="empty"
        title="Aucune fiche associée"
        description="Ce compte n'a pas de fiche dans l'annuaire. C'est le cas des comptes administrateur, qui ne sont ni soignants ni patients."
      />
    );
  }

  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Fiche indisponible" description={etat.message} />;
  }

  const { type, fiche } = etat.donnees;
  let champs: ChampProfil[];
  if (type === "doctor") {
    champs = champsMedecin(fiche as DoctorProfile);
  } else if (type === "patient") {
    champs = champsPatient(fiche as PatientProfile);
  } else {
    champs = champsPersonnel(fiche as StaffProfile);
  }

  return (
    <section aria-labelledby="fiche" className="max-w-3xl rounded-lg border border-neutral-200 bg-white">
      <h2
        id="fiche"
        className="border-b border-neutral-200 px-5 py-3 font-heading text-base font-semibold text-secondary-500"
      >
        {fiche.name ?? "Fiche personnelle"}
      </h2>
      <dl className="grid gap-x-8 gap-y-4 px-5 py-4 sm:grid-cols-2">
        {champs.map((champ) => (
          <div key={champ.libelle}>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{champ.libelle}</dt>
            <dd className="mt-0.5 text-sm text-secondary-500">{champ.valeur ?? "Non renseigné"}</dd>
          </div>
        ))}
      </dl>
      {/* La modification passe par PUT /profile/{doctor,patient}/update ; aucune route
          equivalente n'existe pour le personnel. L'edition n'est donc pas proposee ici tant
          que les trois types ne peuvent pas etre traites de la meme facon. */}
      <p className="border-t border-neutral-200 px-5 py-3 text-xs text-neutral-500">
        Pour corriger une information, adressez-vous à l&apos;administration.
      </p>
      {/* Service public sans lien avec le dossier medical : simple raccourci vers /cv. */}
      <p className="border-t border-neutral-200 px-5 py-3 text-sm">
        <a href="/cv" className="font-medium text-primary-700 underline-offset-2 hover:underline">
          Créer ou modifier mon CV
        </a>
        <span className="ml-2 text-xs text-neutral-500">— modèles canadien, français et anglais, en PDF.</span>
      </p>
    </section>
  );
}
