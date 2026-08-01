// Chambres et lits, alignes sur RoomMS/entity/{Room,Bed,RoomCategory}.

import { apiGet, apiSend } from "@/lib/api";
import type { Role } from "@/lib/navigation";

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

/**
 * Roles autorises a placer, transferer ou faire sortir un patient, en miroir de BED_OPERATORS
 * cote RoomAccessFilter. La secretaire y figure : l'admission est un geste d'accueil autant que
 * de soin.
 */
const OPERATEURS_DE_LIT: ReadonlySet<Role> = new Set<Role>(["admin", "secretary", "doctor", "nurse"]);

export const peutGererLesLits = (role: Role): boolean => OPERATEURS_DE_LIT.has(role);

/**
 * Place un patient dans un lit libre.
 *
 * Le backend fait trois ecritures dans la meme transaction — le lit, l'historique de sejour et
 * l'etat de la chambre — de sorte qu'un lit ne peut pas se retrouver marque occupe sans sejour
 * ouvert en face.
 */
export const admettrePatient = (bedId: number, patientId: number, token: string) =>
  apiSend<Room>(`/room/assign-bed/${bedId}/patient/${patientId}`, token, {});

/**
 * Transfere un patient d'un lit vers un autre.
 *
 * Passe par la route dediee plutot que par une sortie suivie d'une admission : celles-ci
 * clotureraient le sejour et en ouvriraient un second, faisant disparaitre la continuite de
 * l'hospitalisation de l'historique.
 */
export const transfererPatient = (
  patientId: number,
  ancienLitId: number,
  nouveauLitId: number,
  token: string
) =>
  apiSend<string>(
    `/room/transfer-patient/${patientId}/from/${ancienLitId}/to/${nouveauLitId}`,
    token,
    {}
  );

/** Fait sortir le patient occupant ce lit : le sejour est clos et le lit repasse libre. */
export const libererLit = (bedId: number, token: string) =>
  apiSend<Room>(`/room/release-bed/${bedId}`, token, {});

/** Lits libres d'une liste de chambres, aplatis et etiquetes pour un menu deroulant. */
export type LitDisponible = {
  bedId: number;
  libelle: string;
};

export const litsDisponibles = (chambres: Room[]): LitDisponible[] =>
  chambres
    // Une chambre en nettoyage ou en maintenance peut porter des lits libres en base ; y placer
    // un patient serait pourtant une erreur. Le filtre est ici parce que le backend, lui, ne
    // regarde que le lit.
    .filter((chambre) => chambre.status !== "CLEANING" && chambre.status !== "MAINTENANCE")
    .flatMap((chambre) =>
      (chambre.beds ?? [])
        .filter((lit) => !litOccupe(lit))
        .map((lit) => ({
          bedId: lit.id,
          libelle: `Chambre ${chambre.roomNumber ?? "?"} — lit ${lit.bedNumber ?? lit.id}${
            chambre.category?.name ? ` (${chambre.category.name})` : ""
          }`,
        }))
    );

/**
 * Roles autorises a signaler une chambre nettoyee, en miroir de CLEANING_REPORTERS.
 * L'infirmiere y figure, contrairement a l'hygiene ou elle est absente : les deux services ne
 * partagent pas leur politique d'acces, et il ne faut pas deduire l'une de l'autre.
 */
const RAPPORTEURS_ENTRETIEN: ReadonlySet<Role> = new Set<Role>(["admin", "secretary", "nurse"]);

export const peutSignalerEntretien = (role: Role): boolean => RAPPORTEURS_ENTRETIEN.has(role);

/** Mise en maintenance : reserve a l'administration et au secretariat (ROOM_MANAGERS). */
const GESTIONNAIRES_CHAMBRE: ReadonlySet<Role> = new Set<Role>(["admin", "secretary"]);

export const peutGererLesChambres = (role: Role): boolean => GESTIONNAIRES_CHAMBRE.has(role);

/** Signale la chambre nettoyee : elle repasse disponible. */
export const marquerNettoyee = (roomId: number, token: string) =>
  apiSend<Room>(`/room/${roomId}/mark-cleaned`, token, {});

/**
 * Met une chambre en maintenance, ou l'en sort.
 *
 * L'etat part en parametre de requete (@RequestParam boolean status). Un seul appel pour les deux
 * sens : le backend n'expose pas deux routes, et en inventer deux ici masquerait qu'il s'agit
 * d'une bascule.
 */
export const basculerMaintenance = (roomId: number, enMaintenance: boolean, token: string) =>
  apiSend<Room>(`/room/${roomId}/maintenance?status=${enMaintenance}`, token, {});
