// Rendez-vous : appels et types, alignes sur Appointment/dto/AppointmentDetails.java.

import { apiGet, apiSend } from "@/lib/api";
import type { Role } from "@/lib/navigation";

/**
 * Etats renvoyes par le backend (Appointment/dto/Status.java).
 *
 * « SHEDULED » n'est pas une faute de frappe ici : c'est l'orthographe de l'enum Java, et donc
 * la valeur reellement persistee en base et serialisee dans les reponses. La corriger cote
 * backend demanderait une migration des lignes existantes ; tant que ce n'est pas fait, le
 * frontend doit lire cette valeur telle quelle.
 */
export type AppointmentStatus = "SHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Appointment = {
  id: number;
  patientId: number | null;
  patientName: string | null;
  patientEmail: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  doctorId: number | null;
  doctorName: string | null;
  /** LocalDateTime Java, serialise sans fuseau : « 2026-08-01T14:30:00 ». */
  appointmentTime: string | null;
  status: AppointmentStatus | null;
  reason: string | null;
  notes: string | null;
  /** Demande d'examen programmee (MedicalRecordMS) ; null pour une consultation. */
  examRequestId: number | null;
  examLabel: string | null;
  examCategory: string | null;
};

/** Libelles affichables. Toute valeur inattendue est rendue telle quelle plutot que masquee. */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SHEDULED: "Planifié",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
};

export const statusLabel = (status: string | null): string =>
  status ? (STATUS_LABELS[status as AppointmentStatus] ?? status) : "—";

/**
 * Planning d'un medecin.
 *
 * AppointmentAccessFilter n'autorise un role DOCTOR que sur son PROPRE identifiant de fiche
 * (celui du claim `profileId` du JWT, relaye en X-Profile-Id). Passer l'id d'un confrere
 * remonte donc un 403, et c'est voulu.
 */
export const fetchAppointmentsByDoctor = (doctorId: number, token: string) =>
  apiGet<Appointment[]>(`/appointment/getAllByDoctor/${doctorId}`, token);

/** Rendez-vous d'un patient. Meme regle d'appartenance pour le role PATIENT. */
export const fetchAppointmentsByPatient = (patientId: number, token: string) =>
  apiGet<Appointment[]>(`/appointment/getAllByPatient/${patientId}`, token);

/**
 * Formate un LocalDateTime Java pour l'affichage. Renvoie la valeur brute si elle n'est pas
 * analysable : mieux vaut afficher une date etrange qu'un « Invalid Date » qui masque le probleme.
 */
export function formatAppointmentTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Roles autorises a planifier et modifier un rendez-vous, en miroir de SCHEDULING_STAFF cote
 * AppointmentAccessFilter. Le patient en est absent : il n'ouvre pas son creneau lui-meme.
 */
const PLANIFICATEURS: ReadonlySet<Role> = new Set<Role>(["admin", "secretary", "doctor"]);

export const peutPlanifier = (role: Role): boolean => PLANIFICATEURS.has(role);

export type NouveauRendezVous = {
  patientId: number;
  doctorId: number;
  /** LocalDateTime sans fuseau : « 2026-08-12T14:30:00 ». Le backend n'accepte pas de suffixe Z. */
  appointmentTime: string;
  reason?: string | null;
  notes?: string | null;
};

/**
 * Planifie un rendez-vous. Rend l'identifiant cree.
 *
 * Le statut n'est pas transmis : le backend pose SHEDULED. L'envoyer permettrait d'ouvrir un
 * creneau deja marque confirme, sans que personne ne l'ait confirme.
 */
export const planifierRendezVous = (rdv: NouveauRendezVous, token: string) =>
  apiSend<number>("/appointment/schedule", token, { corps: rdv });

export type NouveauRendezVousExamen = {
  patientId: number;
  /** Demande d'examen a programmer. Le libelle et la categorie viennent du backend, pas d'ici. */
  examRequestId: number;
  appointmentTime: string;
  notes?: string | null;
};

/**
 * Programme un examen vers son plateau. Le backend verifie la demande (existante, en attente,
 * au bon patient, pas deja programmee) et recopie son libelle — le motif affiche partout.
 */
export const planifierRendezVousExamen = (rdv: NouveauRendezVousExamen, token: string) =>
  apiSend<number>("/appointment/exam", token, { corps: rdv });

/**
 * Le planning des examens, du plus proche au plus lointain. La categorie restreint a un plateau :
 * le laboratoire demande BIOLOGY, l'imagerie IMAGING. Ouvert aussi a ces deux roles.
 */
export const fetchExamAppointments = (token: string, category?: string) =>
  apiGet<Appointment[]>(`/appointment/exams${category ? `?category=${category}` : ""}`, token);

/**
 * Deplace un rendez-vous.
 *
 * La date part en parametre de requete et non dans un corps : c'est la signature du backend
 * (@RequestParam String newDateTime). Elle est encodee, le « + » d'un fuseau serait sinon lu
 * comme une espace.
 */
export const reprogrammerRendezVous = (id: number, nouvelleDate: string, token: string) =>
  apiSend<string>(
    `/appointment/reschedule/${id}?newDateTime=${encodeURIComponent(nouvelleDate)}`,
    token,
    { methode: "PUT" }
  );

/**
 * Transitions d'etat. Trois gestes distincts et non un champ « statut » modifiable : le backend
 * refuse les passages incoherents, et offrir une liste deroulante laisserait croire que tous les
 * etats sont atteignables depuis n'importe quel autre.
 */
export const confirmerRendezVous = (id: number, token: string) =>
  apiSend<string>(`/appointment/confirm/${id}`, token, { methode: "PUT" });

export const terminerRendezVous = (id: number, token: string) =>
  apiSend<string>(`/appointment/complete/${id}`, token, { methode: "PUT" });

export const annulerRendezVous = (id: number, token: string) =>
  apiSend<string>(`/appointment/cancel/${id}`, token, { methode: "PUT" });

/**
 * Convertit la valeur d'un <input type="datetime-local"> en LocalDateTime Java.
 *
 * Le champ rend « 2026-08-12T14:30 » — sans les secondes. Jackson les exige pour construire un
 * LocalDateTime, d'ou l'ajout. Aucun fuseau n'est ajoute : le backend travaille en heure locale
 * et un suffixe Z decalerait tous les rendez-vous.
 */
export const versLocalDateTime = (saisie: string): string =>
  saisie.length === 16 ? `${saisie}:00` : saisie;
