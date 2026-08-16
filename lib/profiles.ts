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
  gender: string | null;
  allergies: string | null;
  chronicDisease: string | null;
};

/**
 * Groupes sanguins, dans l'ordre des valeurs de ProfileMS/dto/BloodGroup.java.
 *
 * Cette table est la seule source : le formulaire d'accueil en tire ses options et les ecrans de
 * lecture leur libelle. Les separer laisserait un ecran afficher « B_POSITIVE » quand l'autre
 * propose « B+ », ce qui s'etait produit.
 *
 * Le signe negatif est le vrai moins typographique (U+2212) et non un trait d'union : a la
 * lecture d'un groupe sanguin, la difference entre « B+ » et « B− » ne doit jamais tenir a un
 * glyphe trop court.
 */
export const GROUPES_SANGUINS = [
  { valeur: "O_POSITIVE", libelle: "O+" },
  { valeur: "O_NEGATIVE", libelle: "O−" },
  { valeur: "A_POSITIVE", libelle: "A+" },
  { valeur: "A_NEGATIVE", libelle: "A−" },
  { valeur: "B_POSITIVE", libelle: "B+" },
  { valeur: "B_NEGATIVE", libelle: "B−" },
  { valeur: "AB_POSITIVE", libelle: "AB+" },
  { valeur: "AB_NEGATIVE", libelle: "AB−" },
] as const;

/** Miroir de ProfileMS/dto/Gender.java. UNKNOWN est une valeur, pas une absence de valeur. */
export const SEXES = [
  { valeur: "UNKNOWN", libelle: "Non renseigné" },
  { valeur: "FEMALE", libelle: "Féminin" },
  { valeur: "MALE", libelle: "Masculin" },
  { valeur: "OTHER", libelle: "Autre" },
] as const;

const libelleParValeur = (table: ReadonlyArray<{ valeur: string; libelle: string }>) =>
  new Map(table.map((entree) => [entree.valeur, entree.libelle]));

const LIBELLE_GROUPE = libelleParValeur(GROUPES_SANGUINS);
const LIBELLE_SEXE = libelleParValeur(SEXES);

/**
 * Rend le libelle d'un groupe sanguin, ou la valeur brute si elle est inconnue de la table.
 *
 * Afficher la valeur brute plutot qu'un tiret est delibere : une valeur que le frontend ne sait
 * pas traduire doit rester visible, sinon un ajout cote backend disparait silencieusement de
 * l'ecran.
 */
export const libelleGroupeSanguin = (valeur: string | null): string =>
  valeur ? (LIBELLE_GROUPE.get(valeur) ?? valeur) : "—";

export const libelleSexe = (valeur: string | null): string =>
  valeur ? (LIBELLE_SEXE.get(valeur) ?? valeur) : "—";

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

/** Annuaire du personnel. Ouvert a l'administration, l'accueil et les ressources humaines. */
export const fetchAllStaff = (token: string) => apiGet<StaffProfile[]>("/profile/staff", token);

/** Liste des patients. Ouverte au personnel soignant et a l'accueil, fermee aux patients. */
export const fetchAllPatients = (token: string) => apiGet<PatientProfile[]>("/profile/patient", token);

/** Annuaire des medecins, ouvert a tout role authentifie. */
export const fetchAllDoctors = (token: string) => apiGet<DoctorProfile[]>("/profile/doctor", token);

/**
 * Libelles des roles du personnel, tels que StaffRole les nomme cote ProfileMS. Une valeur
 * inconnue est rendue telle quelle plutot que masquee.
 */
const ROLES_PERSONNEL: Record<string, string> = {
  ADMIN: "Administrateur",
  DOCTOR: "Médecin",
  NURSE: "Infirmier(ère)",
  PHARMACIST: "Pharmacien(ne)",
  SECRETARY: "Accueil",
  HR_STAFF: "Ressources humaines",
  FINANCE_STAFF: "Finance",
  QUALITY_MANAGER: "Responsable qualité",
  LAB_TECHNICIAN: "Technicien(ne) de laboratoire",
  RADIOLOGIST: "Radiologue",
  PATIENT: "Patient",
};

export const roleLabel = (v: string | null): string => (v ? (ROLES_PERSONNEL[v] ?? v) : "—");

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
  { libelle: "Sexe", valeur: fiche.gender ? libelleSexe(fiche.gender) : null },
  { libelle: "Groupe sanguin", valeur: fiche.bloodGroup ? libelleGroupeSanguin(fiche.bloodGroup) : null },
  { libelle: "Allergies", valeur: texte(fiche.allergies) },
  { libelle: "Maladies chroniques", valeur: texte(fiche.chronicDisease) },
];

export const champsPersonnel = (fiche: StaffProfile): ChampProfil[] => [
  { libelle: "Nom", valeur: texte(fiche.name) },
  { libelle: "Email", valeur: texte(fiche.email) },
  { libelle: "Téléphone", valeur: texte(fiche.phone) },
  { libelle: "Fonction", valeur: texte(fiche.role) },
];
