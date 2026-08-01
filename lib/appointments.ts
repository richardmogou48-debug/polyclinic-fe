// Rendez-vous : appels et types, alignes sur Appointment/dto/AppointmentDetails.java.

import { apiGet } from "@/lib/api";

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
