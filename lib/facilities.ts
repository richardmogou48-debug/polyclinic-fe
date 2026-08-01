// Plateau technique : equipements, hygiene, configuration.
//
// Trois domaines reunis parce qu'ils alimentent le meme tableau de bord — celui de
// l'administration — et se lisent tous en liste plate.

import { apiGet } from "@/lib/api";

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
