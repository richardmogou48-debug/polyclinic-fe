// Chambres et lits, alignes sur RoomMS/entity/{Room,Bed,RoomCategory}.

import { apiGet } from "@/lib/api";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "PARTIALLY_OCCUPIED" | "CLEANING" | "MAINTENANCE";

export type Bed = {
  id: number;
  bedNumber: string | null;
  /** Serialise « isOccupied » cote Java, donc « occupied » une fois passe par Jackson. */
  occupied?: boolean;
  isOccupied?: boolean;
  currentPatientId: number | null;
};

export type RoomCategory = {
  id: number;
  name: string | null;
  description: string | null;
  bedCapacity: number | null;
  pricePerNight: number | null;
  hasTv?: boolean;
  hasWifi?: boolean;
};

export type Room = {
  id: number;
  roomNumber: string | null;
  floorNumber: number | null;
  category: RoomCategory | null;
  status: RoomStatus | null;
  beds: Bed[] | null;
};

const STATUTS: Record<RoomStatus, string> = {
  AVAILABLE: "Libre",
  OCCUPIED: "Occupée",
  PARTIALLY_OCCUPIED: "Partiellement occupée",
  CLEANING: "En nettoyage",
  MAINTENANCE: "En maintenance",
};

export const roomStatusLabel = (v: string | null): string =>
  v ? (STATUTS[v as RoomStatus] ?? v) : "—";

/** « En maintenance » retire la chambre du service : c'est le seul etat qui bloque une admission. */
export const ROOM_STATUS_CLASSES: Record<RoomStatus, string> = {
  AVAILABLE: "bg-primary-50 text-primary-700",
  OCCUPIED: "bg-neutral-100 text-neutral-600",
  PARTIALLY_OCCUPIED: "bg-tertiary-50 text-tertiary-700",
  CLEANING: "bg-tertiary-50 text-tertiary-700",
  MAINTENANCE: "bg-accent-500 text-white",
};

/**
 * Lit occupe ou non.
 *
 * Le champ Java s'appelle `isOccupied` ; selon la version de Jackson et la presence de Lombok,
 * il sort serialise en `occupied` ou en `isOccupied`. On accepte les deux plutot que de parier
 * sur l'un : se tromper afficherait tous les lits comme libres, ce qui est pire qu'inexact.
 */
export const litOccupe = (lit: Bed): boolean => lit.occupied ?? lit.isOccupied ?? false;

/** Etat complet des chambres. Reserve au personnel soignant et a l'accueil. */
export const fetchRooms = (token: string) => apiGet<Room[]>("/room", token);

/** Sejour en cours : un patient, le lit qu'il occupe, depuis quand. */
export type CurrentStay = {
  historyId: number;
  patientId: number | null;
  bedId: number | null;
  bedNumber: string | null;
  roomNumber: string | null;
  floorNumber: number | null;
  categoryName: string | null;
  admissionDate: string | null;
};

/** Patients actuellement hospitalises, l'admission la plus recente d'abord. */
export const fetchCurrentStays = (token: string) => apiGet<CurrentStay[]>("/room/current-stays", token);
