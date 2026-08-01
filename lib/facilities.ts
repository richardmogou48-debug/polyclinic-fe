// Plateau technique : equipements, hygiene, configuration.
//
// Trois domaines reunis parce qu'ils alimentent le meme tableau de bord — celui de
// l'administration — et se lisent tous en liste plate.

import { apiGet, apiSend } from "@/lib/api";
import type { Role } from "@/lib/navigation";

/* ---------- Equipements ---------- */

export type EquipmentStatus = "ACTIVE" | "IN_MAINTENANCE" | "OUT_OF_ORDER" | "RETIRED";
export type EquipmentType = "MEDICAL_DEVICE" | "FURNITURE" | "IT_HARDWARE";

export type Equipment = {
  id: number;
  name: string | null;
  serialNumber: string | null;
  type: EquipmentType | null;
  status: EquipmentStatus | null;
  currentLocation: string | null;
  purchaseDate: string | null;
  nextPreventiveMaintenanceDate: string | null;
  nextCalibrationDate: string | null;
};

const EQUIPMENT_STATUS: Record<EquipmentStatus, string> = {
  ACTIVE: "En service",
  IN_MAINTENANCE: "En maintenance",
  OUT_OF_ORDER: "Hors service",
  RETIRED: "Réformé",
};

const EQUIPMENT_TYPE: Record<EquipmentType, string> = {
  MEDICAL_DEVICE: "Dispositif médical",
  FURNITURE: "Mobilier",
  IT_HARDWARE: "Informatique",
};

/** « Hors service » est le seul etat qui appelle une action immediate. */
export const EQUIPMENT_STATUS_CLASSES: Record<EquipmentStatus, string> = {
  ACTIVE: "bg-primary-50 text-primary-700",
  IN_MAINTENANCE: "bg-tertiary-50 text-tertiary-700",
  OUT_OF_ORDER: "bg-accent-500 text-white",
  RETIRED: "bg-neutral-100 text-neutral-600",
};

/* ---------- Hygiene ---------- */

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type CleaningTaskType = "ROUTINE_CLEANING" | "DISINFECTION" | "STERILIZATION";
export type WasteType = "SHARPS" | "INFECTIOUS" | "PHARMACEUTICAL" | "CHEMICAL" | "GENERAL";
export type DisposalMethod = "INCINERATION" | "AUTOCLAVE" | "CHEMICAL_TREATMENT" | "LANDFILL_SPECIAL";

export type CleaningTask = {
  id: number;
  location: string | null;
  taskType: CleaningTaskType | null;
  status: TaskStatus | null;
  scheduledDate: string | null;
  completedDate: string | null;
  performedBy: string | null;
  notes: string | null;
};

export type WasteLog = {
  id: number;
  wasteType: WasteType | null;
  quantityKg: number | null;
  location: string | null;
  collectionDate: string | null;
  collectedBy: string | null;
  disposalMethod: DisposalMethod | null;
  /** Bordereau d'elimination : exigence reglementaire, d'ou son affichage systematique. */
  disposalCertificateRef: string | null;
};

const TASK_STATUS: Record<TaskStatus, string> = {
  PENDING: "À faire",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  OVERDUE: "En retard",
};

const TASK_TYPE: Record<CleaningTaskType, string> = {
  ROUTINE_CLEANING: "Nettoyage courant",
  DISINFECTION: "Désinfection",
  STERILIZATION: "Stérilisation",
};

const WASTE_TYPE: Record<WasteType, string> = {
  SHARPS: "Objets piquants/coupants",
  INFECTIOUS: "Infectieux",
  PHARMACEUTICAL: "Pharmaceutique",
  CHEMICAL: "Chimique",
  GENERAL: "Général",
};

const DISPOSAL: Record<DisposalMethod, string> = {
  INCINERATION: "Incinération",
  AUTOCLAVE: "Autoclave",
  CHEMICAL_TREATMENT: "Traitement chimique",
  LANDFILL_SPECIAL: "Enfouissement spécialisé",
};

/** « En retard » doit se voir : c'est le seul etat qui signale un manquement. */
export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  PENDING: "bg-tertiary-50 text-tertiary-700",
  IN_PROGRESS: "bg-primary-50 text-primary-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  OVERDUE: "bg-accent-500 text-white",
};

/* ---------- Configuration ---------- */

export type ConfigItem = { id: number; name: string | null; description?: string | null };

/* ---------- Libelles ---------- */

const libelle = <T extends string>(table: Record<T, string>, v: string | null): string =>
  v ? (table[v as T] ?? v) : "—";

export const equipmentStatusLabel = (v: string | null) => libelle(EQUIPMENT_STATUS, v);
export const equipmentTypeLabel = (v: string | null) => libelle(EQUIPMENT_TYPE, v);
export const taskStatusLabel = (v: string | null) => libelle(TASK_STATUS, v);
export const taskTypeLabel = (v: string | null) => libelle(TASK_TYPE, v);
export const wasteTypeLabel = (v: string | null) => libelle(WASTE_TYPE, v);
export const disposalLabel = (v: string | null) => libelle(DISPOSAL, v);

/* ---------- Appels ---------- */

export const fetchEquipment = (token: string) => apiGet<Equipment[]>("/equipment", token);
export const fetchCleaningTasks = (token: string) => apiGet<CleaningTask[]>("/hygiene/cleaning-task", token);
export const fetchWasteLogs = (token: string) => apiGet<WasteLog[]>("/hygiene/waste-log", token);
export const fetchDepartments = (token: string) => apiGet<ConfigItem[]>("/profile/config/department", token);
export const fetchSpecialties = (token: string) => apiGet<ConfigItem[]>("/profile/config/specialty", token);

/**
 * Roles autorises a ecrire en hygiene, en miroir de HYGIENE_STAFF cote HygieneAccessFilter.
 *
 * Etroit — administration et secretariat seulement. L'infirmiere, qui realise pourtant le
 * nettoyage et la collecte, n'y figure pas : c'est une restriction du backend, pas un oubli de
 * cablage ici. L'interface ne propose donc pas ces gestes a qui ne peut pas les enregistrer.
 */
const AGENTS_HYGIENE: ReadonlySet<Role> = new Set<Role>(["admin", "secretary"]);

export const peutEcrireHygiene = (role: Role): boolean => AGENTS_HYGIENE.has(role);

/**
 * Roles autorises a ecrire sur le parc d'equipement.
 *
 * EquipmentAccessFilter ne definit qu'une liste de LECTEURS et refuse toute ecriture aux autres
 * roles ; en pratique l'ecriture suit la meme liste. Verifie a l'usage plutot que deduit : en
 * cas de refus, le message du serveur fait foi.
 */
const GESTIONNAIRES_PARC: ReadonlySet<Role> = new Set<Role>(["admin", "secretary", "doctor"]);

export const peutGererLeParc = (role: Role): boolean => GESTIONNAIRES_PARC.has(role);

export const TYPES_TACHE = Object.entries(TASK_TYPE) as [CleaningTaskType, string][];
export const TYPES_DECHET = Object.entries(WASTE_TYPE) as [WasteType, string][];
export const METHODES_ELIMINATION = Object.entries(DISPOSAL) as [DisposalMethod, string][];
export const TYPES_EQUIPEMENT = Object.entries(EQUIPMENT_TYPE) as [EquipmentType, string][];
export const STATUTS_EQUIPEMENT = Object.entries(EQUIPMENT_STATUS) as [EquipmentStatus, string][];

export type NouvelleTacheNettoyage = {
  location: string;
  taskType: CleaningTaskType;
  /** LocalDateTime sans fuseau. */
  scheduledDate: string;
  notes?: string | null;
};

/** Le statut n'est pas transmis : le backend pose PENDING. */
export const planifierNettoyage = (tache: NouvelleTacheNettoyage, token: string) =>
  apiSend<CleaningTask>("/hygiene/cleaning-task", token, { corps: tache });

/**
 * Marque une tache faite.
 *
 * L'agent qui l'a realisee part en parametre de requete (@RequestParam performedBy), et c'est du
 * TEXTE LIBRE cote backend, non rapproche d'un compte. On y met le nom de la session : sans
 * verification cote serveur, c'est la seule valeur qui ait une chance d'etre exacte.
 */
export const terminerNettoyage = (
  id: number,
  parQui: string,
  notes: string | null,
  token: string
) =>
  apiSend<CleaningTask>(
    `/hygiene/cleaning-task/${id}/complete?performedBy=${encodeURIComponent(parQui)}` +
      (notes ? `&notes=${encodeURIComponent(notes)}` : ""),
    token,
    { methode: "PUT" }
  );

export type NouveauDechet = {
  wasteType: WasteType;
  quantityKg: number;
  location: string;
  /** LocalDateTime sans fuseau. */
  collectionDate: string;
  collectedBy?: string | null;
  disposalMethod: DisposalMethod;
  /** Bordereau d'elimination : exigence reglementaire, pas une note interne. */
  disposalCertificateRef?: string | null;
};

export const consignerDechet = (dechet: NouveauDechet, token: string) =>
  apiSend<WasteLog>("/hygiene/waste-log", token, { corps: dechet });

export type NouvelEquipement = {
  name: string;
  serialNumber: string;
  type: EquipmentType;
  currentLocation?: string | null;
  /** LocalDate : « 2026-08-12 ». */
  purchaseDate?: string | null;
  nextPreventiveMaintenanceDate?: string | null;
  nextCalibrationDate?: string | null;
};

/** Le statut n'est pas transmis : le backend pose ACTIVE. Il se change ensuite, par un geste dedie. */
export const enregistrerEquipement = (equipement: NouvelEquipement, token: string) =>
  apiSend<Equipment>("/equipment", token, { corps: equipement });

export const changerStatutEquipement = (id: number, statut: EquipmentStatus, token: string) =>
  apiSend<Equipment>(`/equipment/${id}/status?status=${statut}`, token, { methode: "PUT" });

export const deplacerEquipement = (id: number, lieu: string, token: string) =>
  apiSend<Equipment>(`/equipment/${id}/location?location=${encodeURIComponent(lieu)}`, token, {
    methode: "PUT",
  });

export type MaintenanceType = "PREVENTIVE" | "CURATIVE" | "CALIBRATION";

export const TYPES_MAINTENANCE: [MaintenanceType, string][] = [
  ["PREVENTIVE", "Préventive"],
  ["CURATIVE", "Curative"],
  ["CALIBRATION", "Étalonnage"],
];

export type NouvelleMaintenance = {
  type: MaintenanceType;
  performedBy?: string | null;
  description: string;
  /** En francs CFA. Double cote backend, contrairement aux montants de facturation. */
  cost?: number | null;
  /** Une intervention peut se solder par un echec : le dire est le seul moyen de le suivre. */
  successfullyResolved: boolean;
};

export const consignerMaintenance = (
  equipmentId: number,
  intervention: NouvelleMaintenance,
  token: string
) => apiSend(`/equipment/${equipmentId}/maintenance`, token, { corps: intervention });
