// Dossier medical : appels et types, alignes sur les entites de MedicalRecordMS.
//
// Le service renvoie ses entites JPA telles quelles, sans DTO. Deux consequences pour le client :
// les collections d'un dossier neuf arrivent a `null` et non a `[]`, et les champs non renseignes
// arrivent a `null`. Tout ce fichier traite donc le null comme un cas nominal, pas comme une erreur.

import { apiBlob, apiGet, apiSend, apiUpload } from "@/lib/api";

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
  /**
   * Renseigne uniquement lorsque le traitement a ete prescrit alors que des examens demandes
   * n'avaient pas rendu. Null est le cas nominal.
   */
  derogationMotif: string | null;
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
  /**
   * Une consultation porte plusieurs ordonnances, et non une seule comme auparavant : le medecin
   * prescrit les examens, lit les resultats, puis le traitement — sur la meme consultation.
   */
  prescriptions: Prescription[] | null;
  /** Examens demandes lors de cette consultation, resultat inclus quand il existe. */
  exams: ExamRequest[] | null;
  attachments: MedicalAttachment[] | null;
};

export type ExamCategory = "BIOLOGY" | "IMAGING" | "FUNCTIONAL" | "OTHER";
export type ExamStatus = "REQUESTED" | "COMPLETED" | "CANCELLED";

export type ExamResult = {
  id: number;
  performedBy: number | null;
  performedAt: string | null;
  findings: string | null;
  conclusion: string | null;
  /** Hors normes. Pose par le soignant, jamais deduit de valeurs de reference cote backend. */
  abnormal: boolean;
};

export type ExamRequest = {
  id: number;
  requestedBy: number | null;
  requestedAt: string | null;
  category: ExamCategory | null;
  label: string | null;
  clinicalIndication: string | null;
  urgent: boolean;
  status: ExamStatus | null;
  /** Null tant que l'examen n'a pas rendu. */
  result: ExamResult | null;
};

/**
 * Demande d'examen vue hors du dossier : le backend y remonte le patient et la consultation, que
 * l'entite ne porte pas (son lien vers la consultation est @JsonIgnore).
 */
export type ExamRequestView = ExamRequest & {
  patientId: number | null;
  entryId: number | null;
  consultationDate: string | null;
  diagnosis: string | null;
};

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  BIOLOGY: "Biologie",
  IMAGING: "Imagerie",
  FUNCTIONAL: "Exploration fonctionnelle",
  OTHER: "Autre",
};

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  REQUESTED: "En attente",
  COMPLETED: "Résultat rendu",
  CANCELLED: "Annulée",
};

export const examCategoryLabel = (valeur: string | null): string =>
  valeur ? (EXAM_CATEGORY_LABELS[valeur as ExamCategory] ?? valeur) : "—";

export const examStatusLabel = (valeur: string | null): string =>
  valeur ? (EXAM_STATUS_LABELS[valeur as ExamStatus] ?? valeur) : "—";

export type VitalSign = {
  id: number;
  nurseId: number | null;
  timestamp: string | null;
  bloodPressure: string | null;
  heartRate: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  /** Kilogrammes, BigDecimal cote backend — donc un nombre une fois serialise. */
  weightKg: number | null;
  /** Centimetres. L'IMC n'est pas stocke : il se calcule a partir de ces deux mesures. */
  heightCm: number | null;
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

/** Examens d'un patient, le plus recent d'abord, resultat inclus. */
export const fetchExamsByPatient = (patientId: number, token: string) =>
  apiGet<ExamRequestView[]>(`/medicalrecord/patient/${patientId}/exams`, token);

/**
 * Examen vu par la facturation : la vue pauvre servie a l'accueil — ni indication clinique,
 * ni resultat. Le dossier medical complet lui reste ferme.
 */
export type ExamBillingInfo = {
  id: number;
  patientId: number | null;
  category: ExamCategory | null;
  label: string | null;
  requestedAt: string | null;
  urgent: boolean;
  status: ExamStatus | null;
  /** Tarif de la nomenclature quand l'examen y est rattache, null pour une saisie libre. */
  price: number | null;
};

/** Examens facturables d'un patient : toutes ses demandes sauf les annulees. */
export const fetchBillableExams = (patientId: number, token: string) =>
  apiGet<ExamBillingInfo[]>(`/medicalrecord/patient/${patientId}/exams/billable`, token);

/** Intervention vue par la facturation : ni notes operatoires, ni equipe. */
export type SurgeryBillingInfo = {
  id: number;
  patientId: number | null;
  procedureName: string | null;
  scheduledDate: string | null;
  status: SurgeryStatus | null;
};

/** Interventions facturables d'un patient, pour la ligne de facture SURGERY. */
export const fetchBillableSurgeries = (patientId: number, token: string) =>
  apiGet<SurgeryBillingInfo[]>(`/medicalrecord/patient/${patientId}/surgeries/billable`, token);

/** Piece jointe d'un examen : compte rendu (PDF) ou cliche (PNG, JPEG). */
export type ExamAttachment = {
  id: number;
  fileName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  uploadedBy: number | null;
  uploadedAt: string | null;
};

/** Les pieces d'un examen. Le patient n'obtient que celles de son propre dossier. */
export const fetchExamAttachments = (examId: number, token: string) =>
  apiGet<ExamAttachment[]>(`/medicalrecord/exam/${examId}/attachments`, token);

/** Depose un compte rendu ou un cliche sur un examen. Reserve a ceux qui rendent les resultats. */
export const televerserPieceExamen = (examId: number, fichier: File, token: string) =>
  apiUpload<ExamAttachment>(`/medicalrecord/exam/${examId}/attachment`, token, fichier);

/**
 * Ouvre une piece dans un nouvel onglet. Le fichier passe par fetch — une balise <a> ne sait pas
 * porter le jeton — puis par un blob dont l'URL est revoquee une fois l'onglet servi.
 */
export async function ouvrirPieceExamen(piece: ExamAttachment, token: string): Promise<void> {
  const blob = await apiBlob(`/medicalrecord/attachment/${piece.id}/file`, token);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  // Revocation differee : la revoquer tout de suite couperait le chargement de l'onglet.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Taille lisible d'une piece : « 1,3 Mo », « 480 Ko ». */
export function tailleLisible(octets: number | null): string {
  if (octets === null || octets < 0) {
    return "—";
  }
  if (octets < 1024 * 1024) {
    return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  }
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/**
 * Acte de la nomenclature tarifaire. Le libelle et la categorie font foi quand une demande le
 * reference ; le prix (en FCFA) est celui que la facturation applique, et que l'administration
 * peut modifier.
 */
export type ExamCatalogItem = {
  id: number;
  label: string | null;
  category: ExamCategory | null;
  price: number | null;
  active: boolean;
};

/** La nomenclature : actifs seuls par defaut, entiere avec all pour l'ecran d'administration. */
export const fetchExamCatalog = (token: string, all = false) =>
  apiGet<ExamCatalogItem[]>(`/medicalrecord/exam-catalog${all ? "?all=true" : ""}`, token);

export type NouvelActe = {
  label: string;
  category: ExamCategory;
  price: number;
  active?: boolean;
};

/** Ajoute un acte a la nomenclature. Reserve a l'administration cote backend. */
export const creerActeCatalogue = (acte: NouvelActe, token: string) =>
  apiSend<ExamCatalogItem>("/medicalrecord/exam-catalog", token, { corps: acte });

/** Modifie un acte — c'est par ici que le tarif s'ajuste. L'acte part entier. */
export const majActeCatalogue = (id: number, acte: NouvelActe, token: string) =>
  apiSend<ExamCatalogItem>(`/medicalrecord/exam-catalog/${id}`, token, {
    corps: acte,
    methode: "PUT",
  });

/**
 * File du plateau technique : les examens qui n'ont pas rendu, urgents d'abord.
 *
 * Contrairement a la file des ordonnances, celle-ci dit reellement « ce qui reste a faire » : la
 * demande porte un statut, et il bascule a l'enregistrement du resultat.
 *
 * La categorie restreint la file a un plateau — biologie pour le laboratoire, imagerie pour la
 * radio. Omise, la file entiere : l'ecran du medecin et de l'infirmiere.
 */
export const fetchPendingExams = (token: string, category?: ExamCategory) =>
  apiGet<ExamRequestView[]>(
    category ? `/medicalrecord/exams/pending?category=${category}` : "/medicalrecord/exams/pending",
    token
  );

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
