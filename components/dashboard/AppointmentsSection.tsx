"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import {
  fetchAppointmentsByDoctor,
  fetchAppointmentsByPatient,
  formatAppointmentTime,
  statusLabel,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments";

/**
 * Liste de rendez-vous vue par son titulaire — medecin ou patient.
 *
 * Les deux ecrans lisent le meme type de donnee et n'ont qu'a montrer l'interlocuteur d'en
 * face : le patient pour le medecin, le medecin pour le patient. D'ou un seul composant
 * plutot que deux presque identiques.
 *
 * Le chargement se fait cote navigateur et non dans un composant serveur : le jeton vit dans
 * localStorage, auquel le serveur n'a pas acces.
 */
export type Perspective = "doctor" | "patient";

const CLASSES_STATUT: Record<AppointmentStatus, string> = {
  SHEDULED: "bg-tertiary-50 text-tertiary-700",
  CONFIRMED: "bg-primary-50 text-primary-700",
  CANCELLED: "bg-accent-50 text-accent-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
};

const CLASSE_STATUT_INCONNU = "bg-neutral-100 text-neutral-600";

const REGLAGES: Record<
  Perspective,
  {
    charger: (profileId: number, token: string) => Promise<Appointment[]>;
    colonne: string;
    interlocuteur: (rdv: Appointment) => string | null;
    complement: (rdv: Appointment) => string | null;
    titreSansFiche: string;
    detailSansFiche: string;
    detailVide: string;
  }
> = {
  doctor: {
    charger: fetchAppointmentsByDoctor,
    colonne: "Patient",
    interlocuteur: (rdv) => rdv.patientName,
    complement: (rdv) => rdv.patientPhone,
    titreSansFiche: "Aucune fiche médecin associée",
    detailSansFiche:
      "Ce compte n'a pas de fiche dans l'annuaire, son planning ne peut donc pas être identifié. Un administrateur doit lui en rattacher une.",
    detailVide: "Aucune consultation n'est planifiée à votre nom pour le moment.",
  },
  patient: {
    charger: fetchAppointmentsByPatient,
    colonne: "Médecin",
    interlocuteur: (rdv) => rdv.doctorName,
    // Le telephone affiche cote medecin est celui du patient : rien d'equivalent a montrer ici,
    // AppointmentDetails ne porte aucun contact du praticien.
    complement: () => null,
    titreSansFiche: "Aucune fiche patient associée",
    detailSansFiche:
      "Ce compte n'a pas de fiche patient, ses rendez-vous ne peuvent donc pas être retrouvés. Contactez l'accueil.",
    detailVide: "Vous n'avez aucun rendez-vous pour le moment.",
  },
};

export default function AppointmentsSection({ perspective }: { perspective: Perspective }) {
  const reglages = REGLAGES[perspective];

  // Un compte sans fiche ProfileMS n'a pas d'identifiant exploitable ici — le cas se produit pour
  // tout compte cree directement en base plutot que par /user/register ou le seeder, seuls chemins
  // provisionnant une fiche. Rendre null bascule en « impossible » : message explicite plutot
  // qu'une liste vide, qui laisserait croire a une absence de rendez-vous.
  const etat = useAuthenticatedResource(
    (session) =>
      session.profileId ? reglages.charger(Number(session.profileId), session.token) : null,
    [perspective]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des rendez-vous…" />;
  }

  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title={reglages.titreSansFiche}
        description={reglages.detailSansFiche}
      />
    );
  }

  if (etat.phase === "erreur") {
    return (
      <SectionMessage variant="error" title="Rendez-vous indisponibles" description={etat.message} />
    );
  }

  if (etat.donnees.length === 0) {
    return (
      <SectionMessage variant="empty" title="Aucun rendez-vous" description={reglages.detailVide} />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Liste des rendez-vous</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Date et heure</th>
            <th scope="col" className="px-4 py-3 font-medium">{reglages.colonne}</th>
            <th scope="col" className="px-4 py-3 font-medium">Motif</th>
            <th scope="col" className="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.donnees.map((rdv) => {
            const complement = reglages.complement(rdv);
            return (
              <tr key={rdv.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3 text-secondary-500">
                  {formatAppointmentTime(rdv.appointmentTime)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-secondary-500">
                    {reglages.interlocuteur(rdv) ?? "—"}
                  </span>
                  {complement && <span className="block text-xs text-neutral-500">{complement}</span>}
                </td>
                <td className="px-4 py-3 text-neutral-600">{rdv.reason ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      rdv.status
                        ? (CLASSES_STATUT[rdv.status] ?? CLASSE_STATUT_INCONNU)
                        : CLASSE_STATUT_INCONNU
                    }`}
                  >
                    {statusLabel(rdv.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
