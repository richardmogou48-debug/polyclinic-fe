// Teleconsultation : sessions video, alignees sur TelemedicineMS/entity/TeleconsultationSession.
//
// Ce module ne couvre que la LISTE des sessions. Rejoindre une consultation suppose une
// negociation WebRTC (voir SignalType : OFFER, ANSWER, ICE_CANDIDATE cote backend), qui n'est
// pas cablee ici : l'ecran affiche les sessions et leur code, il n'ouvre pas de flux video.

import { apiGet } from "@/lib/api";

export type SessionStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";

export type TeleconsultationSession = {
  id: number;
  appointmentId: number | null;
  patientId: number | null;
  doctorId: number | null;
  /** Identifiant de salon, unique. C'est ce que l'on communique au participant. */
  sessionCode: string | null;
  status: SessionStatus | null;
  scheduledTime: string | null;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
};

const STATUTS: Record<SessionStatus, string> = {
  SCHEDULED: "Programmée",
  ACTIVE: "En cours",
  ENDED: "Terminée",
  CANCELLED: "Annulée",
};

export const sessionStatusLabel = (v: string | null): string =>
  v ? (STATUTS[v as SessionStatus] ?? v) : "—";

/** « En cours » est le seul etat sur lequel on agit : il porte la couleur de marque. */
export const SESSION_STATUS_CLASSES: Record<SessionStatus, string> = {
  SCHEDULED: "bg-tertiary-50 text-tertiary-700",
  ACTIVE: "bg-primary-500 text-white",
  ENDED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-accent-50 text-accent-700",
};

export const fetchSessionsByPatient = (patientId: number, token: string) =>
  apiGet<TeleconsultationSession[]>(`/telemedicine/session/patient/${patientId}`, token);

export const fetchSessionsByDoctor = (doctorId: number, token: string) =>
  apiGet<TeleconsultationSession[]>(`/telemedicine/session/doctor/${doctorId}`, token);
