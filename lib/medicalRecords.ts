// Dossier medical : appels et types, alignes sur les entites de MedicalRecordMS.
//
// Le service renvoie ses entites JPA telles quelles, sans DTO. Deux consequences pour le client :
// les collections d'un dossier neuf arrivent a `null` et non a `[]`, et les champs non renseignes
// arrivent a `null`. Tout ce fichier traite donc le null comme un cas nominal, pas comme une erreur.

import { apiGet } from "@/lib/api";

/** Sérialisé en chaine (@Enumerated(EnumType.STRING)), contrairement au statut des rendez-vous. */
export type SurgeryStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export type PrescribedItem = {
  id: number;
  medicineId: number | null;
  medicineName: string | null;
  dosage: string | null;
  duration: string | null;
};

export type Prescription = {
  id: number;
  issueDate: string | null;
  items: PrescribedItem[] | null;
};

export type MedicalAttachment = {
  id: number;
  fileName: string | null;
  fileType: string | null;
  fileUrl: string | null;
  uploadDate: string | null;
};

export type MedicalEntry = {
  id: number;
  /** Fiche ProfileMS du praticien. Etablie par le backend depuis l'identite verifiee. */
  doctorId: number | null;
  consultationDate: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  additionalNotes: string | null;
  prescription: Prescription | null;
  attachments: MedicalAttachment[] | null;
};

export type VitalSign = {
  id: number;
  nurseId: number | null;
  timestamp: string | null;
  bloodPressure: string | null;
  heartRate: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  additionalNotes: string | null;
};

export type SurgeryRecord = {
  id: number;
  procedureName: string | null;
  surgeonId: number | null;
  anesthesiologistId: number | null;
  anesthesiaType: string | null;
  scheduledDate: string | null;
  completionDate: string | null;
  status: SurgeryStatus | null;
  preoperativeNotes: string | null;
  postoperativeNotes: string | null;
};

export type MedicalRecord = {
  id: number;
  patientId: number;
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  familyHistory: string | null;
  entries: MedicalEntry[] | null;
  vitalSigns: VitalSign[] | null;
  surgeries: SurgeryRecord[] | null;
};

export const SURGERY_STATUS_LABELS: Record<SurgeryStatus, string> = {
  SCHEDULED: "Programmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Réalisée",
};

export const surgeryStatusLabel = (status: string | null): string =>
  status ? (SURGERY_STATUS_LABELS[status as SurgeryStatus] ?? status) : "—";

/**
 * Dossier complet, constantes et interventions comprises.
 *
 * MedicalRecordAccessFilter n'ouvre le dossier d'un patient arbitraire qu'aux roles DOCTOR,
 * ADMIN et NURSE ; les autres, patient compris, ne peuvent lire que le leur. Passer un
 * identifiant qui n'est pas le sien remonte donc un 403, et c'est voulu.
 *
 * getOrCreateRecord cote backend fait qu'un patient sans dossier n'obtient jamais un 404 mais
 * un dossier vide — l'ecran doit donc distinguer « pas encore de dossier » de « erreur ».
 */
export const fetchMedicalRecord = (patientId: number, token: string) =>
  apiGet<MedicalRecord>(`/medicalrecord/patient/${patientId}`, token);

/** Constantes seules, deja triees par horodatage decroissant cote backend. */
export const fetchVitalSigns = (patientId: number, token: string) =>
  apiGet<VitalSign[]>(`/medicalrecord/patient/${patientId}/vitals`, token);

/** Interventions seules. */
export const fetchSurgeries = (patientId: number, token: string) =>
  apiGet<SurgeryRecord[]>(`/medicalrecord/patient/${patientId}/surgery`, token);

/**
 * Ordonnance vue hors du dossier : le backend y remonte le patient et le prescripteur, que
 * l'entite Prescription ne porte pas (son lien vers la consultation est @JsonIgnore).
 */
export type PrescriptionView = {
  id: number;
  issueDate: string | null;
  patientId: number | null;
  doctorId: number | null;
  consultationDate: string | null;
  diagnosis: string | null;
  items: PrescribedItem[] | null;
};

/**
 * File de la pharmacie.
 *
 * ATTENTION : rend les ordonnances RECENTES, pas « celles a delivrer ». Prescription ne porte
 * aucun etat de delivrance, la distinction n'existe pas en base. Ne pas presenter cette liste
 * comme une file d'attente tant qu'un statut n'aura pas ete ajoute cote backend.
 */
export const fetchRecentPrescriptions = (token: string) =>
  apiGet<PrescriptionView[]>("/medicalrecord/prescriptions", token);

/** Ordonnances d'un patient donne. */
export const fetchPrescriptionsByPatient = (patientId: number, token: string) =>
  apiGet<PrescriptionView[]>(`/medicalrecord/patient/${patientId}/prescriptions`, token);

/**
 * Formate un LocalDateTime Java. Renvoie la valeur brute si elle n'est pas analysable : mieux
 * vaut afficher une date etrange qu'un « Invalid Date » qui masque le probleme.
 */
export function formatDateTime(value: string | null, avecHeure = true): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(
    "fr-FR",
    avecHeure ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }
  ).format(date);
}

/** Une mesure absente se distingue d'une mesure a zero : `null` rend un tiret, `0` rend « 0 ». */
export const mesure = (valeur: number | null, unite: string): string =>
  valeur === null || valeur === undefined ? "—" : `${valeur} ${unite}`;
