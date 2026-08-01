// Fiches d'annuaire : medecin, patient, personnel. Alignees sur les DTO de ProfileMS.
//
// Les trois types sont distincts a dessein cote backend — un medecin a un numero d'ordre, un
// patient un groupe sanguin, un membre du personnel ni l'un ni l'autre. On ne les fusionne pas
// ici en un type commun : ce serait rendre optionnel ce qui ne l'est pas.

import { apiGet } from "@/lib/api";
import type { Role } from "@/lib/navigation";

export type DoctorProfile = {
  id: number;
  name: string | null;
  email: string | null;
  /** LocalDate : « 1980-04-12 », sans heure. */
  dob: string | null;
  phone: string | null;
  address: string | null;
  licenseNo: string | null;
  specialization: string | null;
  department: string | null;
  totalExp: number | null;
};

export type PatientProfile = {
  id: number;
  name: string | null;
  email: string | null;
  dob: string | null;
  phone: string | null;
  address: string | null;
  aadharNo: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  chronicDisease: string | null;
};

export type StaffProfile = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};

/** Champ affichable : un libelle et une valeur deja mise en forme. */
export type ChampProfil = { libelle: string; valeur: string | null };

const texte = (v: string | number | null | undefined): string | null =>
  v === null || v === undefined || v === "" ? null : String(v);

/**
 * Quelle fiche interroger pour un role donne.
 *
 * ADMIN n'a volontairement pas de fiche : le seeder cree son compte avec profile_id a NULL,
 * l'administrateur n'etant ni un soignant ni un patient. L'ecran doit le dire plutot que
 * d'echouer.
 */
export function typeDeFiche(role: Role): "doctor" | "patient" | "staff" | null {
  if (role === "doctor") return "doctor";
  if (role === "patient") return "patient";
  if (role === "admin") return null;
  return "staff";
}

export const fetchDoctorProfile = (id: number, token: string) =>
  apiGet<DoctorProfile>(`/profile/doctor/get/${id}`, token);

export const fetchPatientProfile = (id: number, token: string) =>
  apiGet<PatientProfile>(`/profile/patient/get/${id}`, token);

/**
 * Fiche du personnel.
 *
 * ProfileAccessFilter reserve l'annuaire du personnel a l'accueil et a l'administration, mais
 * autorise chacun sur sa propre fiche — sans quoi une infirmiere ne pourrait pas ouvrir son
 * propre profil.
 */
export const fetchStaffProfile = (id: number, token: string) =>
  apiGet<StaffProfile>(`/profile/staff/get/${id}`, token);

export const champsMedecin = (fiche: DoctorProfile): ChampProfil[] => [
  { libelle: "Nom", valeur: texte(fiche.name) },
  { libelle: "Email", valeur: texte(fiche.email) },
  { libelle: "Téléphone", valeur: texte(fiche.phone) },
  { libelle: "Date de naissance", valeur: texte(fiche.dob) },
  { libelle: "Adresse", valeur: texte(fiche.address) },
  { libelle: "Numéro d'ordre", valeur: texte(fiche.licenseNo) },
  { libelle: "Spécialité", valeur: texte(fiche.specialization) },
  { libelle: "Service", valeur: texte(fiche.department) },
  {
    libelle: "Années d'exercice",
    valeur: fiche.totalExp === null || fiche.totalExp === undefined ? null : `${fiche.totalExp} ans`,
  },
];

export const champsPatient = (fiche: PatientProfile): ChampProfil[] => [
  { libelle: "Nom", valeur: texte(fiche.name) },
  { libelle: "Email", valeur: texte(fiche.email) },
  { libelle: "Téléphone", valeur: texte(fiche.phone) },
  { libelle: "Date de naissance", valeur: texte(fiche.dob) },
  { libelle: "Adresse", valeur: texte(fiche.address) },
  { libelle: "Groupe sanguin", valeur: texte(fiche.bloodGroup) },
  { libelle: "Allergies", valeur: texte(fiche.allergies) },
  { libelle: "Maladies chroniques", valeur: texte(fiche.chronicDisease) },
];

export const champsPersonnel = (fiche: StaffProfile): ChampProfil[] => [
  { libelle: "Nom", valeur: texte(fiche.name) },
  { libelle: "Email", valeur: texte(fiche.email) },
  { libelle: "Téléphone", valeur: texte(fiche.phone) },
  { libelle: "Fonction", valeur: texte(fiche.role) },
];
