// Pharmacie : catalogue des medicaments, aligne sur PharmacyMS/entity/Medicine.
//
// NOTE : MedicineInventory (lots, quantites, peremption) existe en entite et en depot, mais
// aucune route ne l'expose et le service ne s'en sert pas. L'ecran « Stock » du pharmacien
// attend donc un endpoint qui reste a ecrire — ce n'est pas un modele manquant.

import { apiGet } from "@/lib/api";

export type MedicineCategory =
  | "ANTIBIOTIC"
  | "ANALGESIC"
  | "ANTIHISTAMINE"
  | "ANTISEPTIC"
  | "VITAMIN"
  | "MINERAL"
  | "HERBAL"
  | "OTHER";

export type MedicineType =
  | "SYRUP"
  | "TABLET"
  | "CAPSULE"
  | "INJECTION"
  | "OINTMENT"
  | "LIQUID"
  | "POWDER"
  | "SPRAY";

export type Medicine = {
  id: number;
  name: string | null;
  dosage: string | null;
  category: MedicineCategory | null;
  type: MedicineType | null;
  manufacturer: string | null;
  /** Entier cote backend, pas un decimal : les prix sont en francs CFA sans centimes. */
  unitPrice: number | null;
  createAt: string | null;
};

const CATEGORIES: Record<MedicineCategory, string> = {
  ANTIBIOTIC: "Antibiotique",
  ANALGESIC: "Antalgique",
  ANTIHISTAMINE: "Antihistaminique",
  ANTISEPTIC: "Antiseptique",
  VITAMIN: "Vitamine",
  MINERAL: "Minéral",
  HERBAL: "Phytothérapie",
  OTHER: "Autre",
};

const TYPES: Record<MedicineType, string> = {
  SYRUP: "Sirop",
  TABLET: "Comprimé",
  CAPSULE: "Gélule",
  INJECTION: "Injectable",
  OINTMENT: "Pommade",
  LIQUID: "Solution",
  POWDER: "Poudre",
  SPRAY: "Spray",
};

export const medicineCategoryLabel = (v: string | null): string =>
  v ? (CATEGORIES[v as MedicineCategory] ?? v) : "—";

export const medicineTypeLabel = (v: string | null): string =>
  v ? (TYPES[v as MedicineType] ?? v) : "—";

/**
 * Catalogue complet.
 *
 * MedicineAccessFilter ouvre cette route a ADMIN, DOCTOR, SECRETARY et PHARMACIST : prescrire
 * suppose de connaitre ce qui est disponible, d'ou la presence du medecin.
 */
export const fetchMedicines = (token: string) =>
  apiGet<Medicine[]>("/pharmacy/medicines/getAll", token);

/** Ligne de stock : un lot d'un medicament, sa quantite et sa peremption. */
export type InventoryLot = {
  id: number;
  medicineId: number | null;
  medicineName: string | null;
  dosage: string | null;
  batchNo: string | null;
  quantity: number | null;
  /** LocalDate : « 2027-04-30 », sans heure. */
  expiryDate: string | null;
  addedDate: string | null;
};

/** Etat du stock, peremption la plus proche d'abord. Reserve a la pharmacie et a l'administration. */
export const fetchInventory = (token: string) =>
  apiGet<InventoryLot[]>("/pharmacy/medicines/inventory", token);
