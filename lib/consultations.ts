// Ecritures du parcours clinique : consultation, examens, resultats, ordonnances.
//
// Les lectures correspondantes vivent dans lib/medicalRecords. La separation tient a une
// difference de nature : lire un dossier est ouvert a tout le personnel soignant, l'ecrire est un
// acte signe. Un seul fichier melangerait les deux regimes.
//
// Regle commune a toutes ces routes : l'auteur de l'acte n'est JAMAIS transmis dans le corps. Le
// backend l'etablit depuis l'en-tete d'identite pose par la Gateway apres verification du JWT, et
// ecrase ce que porterait la requete. L'envoyer donnerait l'illusion que le client choisit qui
// signe.

import { apiSend } from "@/lib/api";
import type { Role } from "@/lib/navigation";
import type {
  ExamCategory,
  ExamRequest,
  ExamResult,
  MedicalEntry,
  Prescription,
} from "@/lib/medicalRecords";

/**
 * Roles autorises a consigner une consultation, demander un examen ou prescrire, en miroir de
 * RECORD_AUTHORS cote MedicalRecordAccessFilter.
 *
 * L'infirmiere en est absente et c'est la seule barriere qui l'empeche de prescrire. L'interface
 * ne propose donc pas ces actions a qui ne peut pas les enregistrer, plutot que d'afficher des
 * boutons qui echoueraient en 403.
 */
const PRESCRIPTEURS: ReadonlySet<Role> = new Set<Role>(["doctor", "admin"]);

export const peutPrescrire = (role: Role): boolean => PRESCRIPTEURS.has(role);

/**
 * Roles autorises a rendre un resultat d'examen, en miroir de EXAM_RESULT_AUTHORS.
 *
 * L'infirmiere y figure : la polyclinique n'a pas de role de technicien de laboratoire, et c'est
 * elle qui realise les prelevements et saisit ce que rend le plateau technique.
 */
const RENDEURS_DE_RESULTAT: ReadonlySet<Role> = new Set<Role>(["doctor", "admin", "nurse"]);

export const peutRendreResultat = (role: Role): boolean => RENDEURS_DE_RESULTAT.has(role);

export type NouvelleConsultation = {
  symptoms: string;
  diagnosis: string;
  treatmentPlan?: string | null;
  additionalNotes?: string | null;
};

/**
 * Consigne une consultation. Rend l'entree creee, dont l'identifiant est indispensable pour
 * attacher ensuite les examens et l'ordonnance.
 */
export const consignerConsultation = (
  patientId: number,
  consultation: NouvelleConsultation,
  token: string
) => apiSend<MedicalEntry>(`/medicalrecord/patient/${patientId}/entry`, token, { corps: consultation });

export type NouvelleDemandeExamen = {
  category: ExamCategory;
  label: string;
  clinicalIndication?: string | null;
  urgent: boolean;
};

/**
 * Demande un examen au cours d'une consultation.
 *
 * Le statut n'est pas transmis : le backend le force a REQUESTED. L'annoncer COMPLETED ferait
 * passer un examen pour rendu sans resultat consultable, et leverait le verrou sur les
 * medicaments.
 */
export const demanderExamen = (
  entryId: number,
  demande: NouvelleDemandeExamen,
  token: string
) => apiSend<ExamRequest>(`/medicalrecord/entry/${entryId}/exam`, token, { corps: demande });

export type NouveauResultat = {
  findings?: string | null;
  conclusion?: string | null;
  abnormal: boolean;
};

/** Enregistre un resultat, ce qui bascule la demande a COMPLETED. Un second resultat est refuse. */
export const rendreResultat = (examId: number, resultat: NouveauResultat, token: string) =>
  apiSend<ExamResult>(`/medicalrecord/exam/${examId}/result`, token, { corps: resultat });

export type LigneOrdonnance = {
  /** Reference PharmacyMS quand le medicament vient du catalogue. Le backend la valide. */
  medicineId?: number | null;
  medicineName: string;
  dosage: string;
  duration: string;
};

export type NouvelleOrdonnance = {
  items: LigneOrdonnance[];
  /**
   * Renseigne uniquement pour passer outre des examens en attente. Le backend l'ecarte s'il n'y
   * a rien a deroger : un motif enregistre sans objet rendrait le champ inexploitable a la
   * relecture.
   */
  derogationMotif?: string | null;
};

/**
 * Consigne une ordonnance.
 *
 * Repond 409 si des examens demandes lors de cette consultation n'ont pas rendu et qu'aucun motif
 * de derogation n'accompagne l'ordonnance. Le formulaire s'appuie sur ce refus plutot que de
 * reimplementer la regle : elle n'a qu'un seul endroit ou vivre, et c'est le backend.
 */
export const prescrire = (entryId: number, ordonnance: NouvelleOrdonnance, token: string) =>
  apiSend<Prescription>(`/medicalrecord/entry/${entryId}/prescription`, token, { corps: ordonnance });
