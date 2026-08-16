"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { formatAppointmentTime, statusLabel, type Appointment } from "@/lib/appointments";
import { fetchAllAppointments } from "@/lib/appointments-all";
import { fetchAllPatients, fetchAllStaff, libelleGroupeSanguin, roleLabel } from "@/lib/profiles";
import { fetchUsers, type UserSummary } from "@/lib/users";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import type { PatientProfile, StaffProfile } from "@/lib/profiles";

/**
 * Les quatre annuaires de pilotage : comptes, personnel, patients, rendez-vous.
 *
 * Regroupes parce qu'ils partagent exactement la meme forme — une liste plate, sans selection
 * ni detail — et se retrouvent dans les tableaux de bord administrateur, accueil et ressources
 * humaines. Ce qui les distingue tient aux colonnes, qui restent ecrites une par une.
 */
export type Annuaire = "comptes" | "personnel" | "patients" | "rendez-vous";

type Donnees = UserSummary[] | StaffProfile[] | PatientProfile[] | Appointment[];

const VIDE: Record<Annuaire, { titre: string; detail: string }> = {
  comptes: { titre: "Aucun compte", detail: "Aucun compte utilisateur n'existe encore." },
  personnel: { titre: "Annuaire vide", detail: "Aucun membre du personnel n'est enregistré." },
  patients: { titre: "Aucun patient", detail: "Aucun patient n'est enregistré." },
  "rendez-vous": { titre: "Aucun rendez-vous", detail: "Aucun rendez-vous n'a été planifié." },
};

const CLASSES_STATUT: Record<string, string> = {
  SHEDULED: "bg-tertiary-50 text-tertiary-700",
  CONFIRMED: "bg-primary-50 text-primary-700",
  CANCELLED: "bg-accent-50 text-accent-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
};

/**
 * @param cleRafraichissement change de valeur pour forcer un rechargement. C'est ainsi qu'un
 *        formulaire voisin fait apparaitre ce qu'il vient de creer : sans cela la liste
 *        afficherait l'etat d'avant l'ecriture, et l'utilisateur croirait son enregistrement
 *        perdu.
 */
export default function DirectorySection({
  annuaire,
  cleRafraichissement = 0,
}: {
  annuaire: Annuaire;
  cleRafraichissement?: number;
}) {
  const etat = useAuthenticatedResource<Donnees>(
    (session) => {
      if (annuaire === "comptes") return fetchUsers(session.token);
      if (annuaire === "personnel") return fetchAllStaff(session.token);
      if (annuaire === "patients") return fetchAllPatients(session.token);
      return fetchAllAppointments(session.token);
    },
    [annuaire, cleRafraichissement]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Liste indisponible" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Liste indisponible" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    const vide = VIDE[annuaire];
    return <SectionMessage variant="empty" title={vide.titre} description={vide.detail} />;
  }

  if (annuaire === "comptes") {
    const comptes = etat.donnees as UserSummary[];
    return (
      <Tableau colonnes={["Nom", "Email", "Rôle", "Fiche"]} legende="Comptes utilisateurs">
        {comptes.map((compte) => (
          <tr key={compte.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="px-4 py-3 font-medium text-secondary-500">{compte.name ?? "—"}</td>
            <td className="px-4 py-3 text-neutral-600">{compte.email ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{roleLabel(compte.role)}</td>
            {/* Un compte sans fiche n'est pas une anomalie : l'administrateur n'en a pas. */}
            <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
              {compte.profileId === null ? "aucune" : `#${compte.profileId}`}
            </td>
          </tr>
        ))}
      </Tableau>
    );
  }

  if (annuaire === "personnel") {
    const personnel = etat.donnees as StaffProfile[];
    return (
      <Tableau colonnes={["Nom", "Email", "Téléphone", "Fonction"]} legende="Personnel de l'établissement">
        {personnel.map((membre) => (
          <tr key={membre.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="px-4 py-3 font-medium text-secondary-500">{membre.name ?? "—"}</td>
            <td className="px-4 py-3 text-neutral-600">{membre.email ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{membre.phone ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{roleLabel(membre.role)}</td>
          </tr>
        ))}
      </Tableau>
    );
  }

  if (annuaire === "patients") {
    const patients = etat.donnees as PatientProfile[];
    return (
      <Tableau colonnes={["Nom", "Email", "Téléphone", "Groupe sanguin", "Allergies"]} legende="Patients">
        {patients.map((patient) => (
          <tr key={patient.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="px-4 py-3 font-medium text-secondary-500">{patient.name ?? "—"}</td>
            <td className="px-4 py-3 text-neutral-600">{patient.email ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{patient.phone ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
              {libelleGroupeSanguin(patient.bloodGroup)}
            </td>
            {/* Les allergies sont ce qu'un soignant doit voir en priorite sur une liste. */}
            <td className="px-4 py-3 text-neutral-600">{patient.allergies ?? "—"}</td>
          </tr>
        ))}
      </Tableau>
    );
  }

  const rendezVous = etat.donnees as Appointment[];
  return (
    <Tableau
      colonnes={["Date et heure", "Patient", "Médecin", "Motif", "Statut", "Document"]}
      legende="Rendez-vous de l'établissement"
    >
      {rendezVous.map((rdv) => (
        <tr key={rdv.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
          <td className="whitespace-nowrap px-4 py-3 text-secondary-500">
            {formatAppointmentTime(rdv.appointmentTime)}
          </td>
          <td className="px-4 py-3 text-neutral-600">
            {rdv.patientName ?? (rdv.patientId === null ? "—" : `#${rdv.patientId}`)}
          </td>
          {/* Le nom du medecin n'est pas enrichi par ce service : seule la reference est connue.
              Un rendez-vous d'examen n'a pas de medecin — la colonne nomme alors le plateau. */}
          <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
            {rdv.examRequestId !== null
              ? "Plateau technique"
              : (rdv.doctorName ?? (rdv.doctorId === null ? "—" : `#${rdv.doctorId}`))}
          </td>
          <td className="px-4 py-3 text-neutral-600">{rdv.reason ?? "—"}</td>
          <td className="px-4 py-3">
            <span
              className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                (rdv.status && CLASSES_STATUT[rdv.status]) ?? "bg-neutral-100 text-neutral-600"
              }`}
            >
              {statusLabel(rdv.status)}
            </span>
          </td>
          <td className="whitespace-nowrap px-4 py-3">
            <a
              href={`/print/convocation/${rdv.id}`}
              target="_blank"
              rel="noopener"
              className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              Convocation
            </a>
          </td>
        </tr>
      ))}
    </Tableau>
  );
}

function Tableau({
  colonnes,
  legende,
  children,
}: {
  colonnes: string[];
  legende: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{legende}</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {colonnes.map((colonne) => (
              <th key={colonne} scope="col" className="px-4 py-3 font-medium">
                {colonne}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
}
