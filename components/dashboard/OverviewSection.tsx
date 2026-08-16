"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import StatCard, { type TonStat } from "@/components/dashboard/StatCard";
import { fetchAppointmentsByDoctor, fetchAppointmentsByPatient, type Appointment } from "@/lib/appointments";
import { fetchAllAppointments } from "@/lib/appointments-all";
import { fetchInvoices, fetchInvoicesByPatient, montant, type Invoice } from "@/lib/billing";
import { fetchCleaningTasks, fetchEquipment } from "@/lib/facilities";
import { fetchPendingExams, fetchRecentPrescriptions } from "@/lib/medicalRecords";
import { fetchMedicines } from "@/lib/pharmacy";
import { fetchAllPatients, fetchAllStaff } from "@/lib/profiles";
import { fetchAudits, fetchComplaints, fetchIncidents } from "@/lib/quality";
import { fetchUsers } from "@/lib/users";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import type { Role } from "@/lib/navigation";
import type { Session } from "@/lib/auth";

/**
 * Vue d'ensemble d'un tableau de bord : quelques chiffres, aucun graphique.
 *
 * Le choix de la forme est deliberе. Ces indicateurs sont des cardinalites a un instant donne —
 * combien de rendez-vous, combien d'impayes — sans serie temporelle ni comparaison entre
 * categories. Un graphique n'y ajouterait rien qu'un nombre ne dise deja, et couterait a lire.
 *
 * Chaque vue agrege des appels qui existent deja : rien n'est demande au backend pour cet ecran.
 */
type Tuile = { label: string; value: string; hint?: string; ton?: TonStat; mention?: string };

const nombre = (n: number) => String(n);

/** Un rendez-vous compte comme a venir s'il n'est ni annule ni termine. */
const aVenir = (rdv: Appointment[]) =>
  rdv.filter((r) => r.status !== "CANCELLED" && r.status !== "COMPLETED").length;

const resteDu = (factures: Invoice[]) =>
  factures.reduce((total, f) => total + (f.balanceDue ?? 0), 0);

const impayees = (factures: Invoice[]) =>
  factures.filter((f) => f.status === "UNPAID" || f.status === "PARTIALLY_PAID").length;

async function tuilesPour(role: Role, session: Session): Promise<Tuile[]> {
  const t = session.token;
  const fiche = session.profileId ? Number(session.profileId) : null;

  if (role === "patient") {
    if (fiche === null) return [];
    const [rdv, factures] = await Promise.all([
      fetchAppointmentsByPatient(fiche, t),
      fetchInvoicesByPatient(fiche, t),
    ]);
    const du = resteDu(factures);
    return [
      { label: "Rendez-vous à venir", value: nombre(aVenir(rdv)), hint: `${rdv.length} au total` },
      { label: "Factures", value: nombre(factures.length) },
      {
        label: "Reste à payer",
        value: montant(du),
        ton: du > 0 ? "critique" : "neutre",
        mention: du > 0 ? "à régler" : undefined,
      },
    ];
  }

  if (role === "doctor") {
    if (fiche === null) return [];
    const rdv = await fetchAppointmentsByDoctor(fiche, t);
    const patients = new Set(rdv.map((r) => r.patientId).filter((id) => id !== null)).size;
    return [
      { label: "Consultations à venir", value: nombre(aVenir(rdv)), hint: `${rdv.length} au total` },
      { label: "Patients suivis", value: nombre(patients), hint: "Vus au moins une fois" },
    ];
  }

  if (role === "nurse") {
    const patients = await fetchAllPatients(t);
    return [{ label: "Patients enregistrés", value: nombre(patients.length) }];
  }

  if (role === "pharmacist") {
    const [medicaments, ordonnances] = await Promise.all([
      fetchMedicines(t),
      fetchRecentPrescriptions(t),
    ]);
    return [
      { label: "Médicaments référencés", value: nombre(medicaments.length) },
      {
        label: "Ordonnances récentes",
        value: nombre(ordonnances.length),
        hint: "Le suivi de délivrance n'est pas géré",
      },
    ];
  }

  if (role === "secretary") {
    const [rdv, patients, factures] = await Promise.all([
      fetchAllAppointments(t),
      fetchAllPatients(t),
      fetchInvoices(t),
    ]);
    const nonReglees = impayees(factures);
    return [
      { label: "Rendez-vous à venir", value: nombre(aVenir(rdv)), hint: `${rdv.length} au total` },
      { label: "Patients enregistrés", value: nombre(patients.length) },
      {
        label: "Factures non réglées",
        value: nombre(nonReglees),
        ton: nonReglees > 0 ? "attention" : "neutre",
        mention: nonReglees > 0 ? "à suivre" : undefined,
      },
    ];
  }

  if (role === "labo" || role === "imagerie") {
    // Le plateau ne lit pas les dossiers : son seul indicateur est sa propre file, deja filtree
    // par categorie cote backend.
    const file = await fetchPendingExams(t, role === "labo" ? "BIOLOGY" : "IMAGING");
    const urgents = file.filter((examen) => examen.urgent).length;
    return [
      { label: "Examens en attente", value: nombre(file.length) },
      {
        label: "Urgents",
        value: nombre(urgents),
        ton: urgents > 0 ? "critique" : "neutre",
        mention: urgents > 0 ? "avant sortie du patient" : undefined,
      },
    ];
  }

  if (role === "hr") {
    const personnel = await fetchAllStaff(t);
    return [{ label: "Effectif", value: nombre(personnel.length), hint: "Membres du personnel enregistrés" }];
  }

  if (role === "finance") {
    const factures = await fetchInvoices(t);
    const nonReglees = impayees(factures);
    const du = resteDu(factures);
    return [
      { label: "Factures émises", value: nombre(factures.length) },
      {
        label: "Non réglées",
        value: nombre(nonReglees),
        ton: nonReglees > 0 ? "attention" : "neutre",
        mention: nonReglees > 0 ? "à recouvrer" : undefined,
      },
      { label: "Encours total", value: montant(du), hint: "Somme des soldes restants" },
    ];
  }

  if (role === "quality") {
    const [plaintes, incidents, audits] = await Promise.all([
      fetchComplaints(t),
      fetchIncidents(t),
      fetchAudits(t),
    ]);
    const ouvertes = plaintes.filter((p) => p.status === "OPEN" || p.status === "UNDER_INVESTIGATION").length;
    const graves = incidents.filter((i) => i.severity === "HIGH" || i.severity === "CRITICAL").length;
    return [
      {
        label: "Plaintes en cours",
        value: nombre(ouvertes),
        hint: `${plaintes.length} au total`,
        ton: ouvertes > 0 ? "attention" : "neutre",
        mention: ouvertes > 0 ? "à traiter" : undefined,
      },
      {
        label: "Incidents graves",
        value: nombre(graves),
        hint: `${incidents.length} signalés au total`,
        ton: graves > 0 ? "critique" : "neutre",
        mention: graves > 0 ? "gravité élevée" : undefined,
      },
      { label: "Audits", value: nombre(audits.length) },
    ];
  }

  // admin
  const [comptes, rdv, parc, taches] = await Promise.all([
    fetchUsers(t),
    fetchAllAppointments(t),
    fetchEquipment(t),
    fetchCleaningTasks(t),
  ]);
  const horsService = parc.filter((e) => e.status === "OUT_OF_ORDER").length;
  const aFaire = taches.filter((x) => x.status === "PENDING" || x.status === "OVERDUE").length;
  return [
    { label: "Comptes", value: nombre(comptes.length), hint: "Tous rôles confondus" },
    { label: "Rendez-vous à venir", value: nombre(aVenir(rdv)), hint: `${rdv.length} au total` },
    {
      label: "Équipements hors service",
      value: nombre(horsService),
      hint: `${parc.length} équipements au parc`,
      ton: horsService > 0 ? "critique" : "neutre",
      mention: horsService > 0 ? "à réparer" : undefined,
    },
    { label: "Tâches de nettoyage à faire", value: nombre(aFaire), hint: `${taches.length} programmées` },
  ];
}

export default function OverviewSection({ role }: { role: Role }) {
  const etat = useAuthenticatedResource<Tuile[]>((session) => tuilesPour(role, session), [role]);

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Vue d'ensemble indisponible" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Vue d'ensemble indisponible" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun indicateur"
        description="Ce compte n'a pas de fiche associée, ses indicateurs ne peuvent pas être calculés."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {etat.donnees.map((tuile) => (
        <StatCard
          key={tuile.label}
          label={tuile.label}
          value={tuile.value}
          hint={tuile.hint}
          ton={tuile.ton}
          mention={tuile.mention}
        />
      ))}
    </div>
  );
}
