// Qualite : plaintes, incidents et audits internes, alignes sur les entites de QualityMS.
//
// Les trois enums sont serialises en chaine (@Enumerated(EnumType.STRING)). Toute valeur
// inattendue est affichee telle quelle plutot que masquee : mieux vaut un libelle brut a
// l'ecran qu'une ligne silencieusement vide.

import { apiGet } from "@/lib/api";

export type ComplaintCategory =
  | "MEDICAL_CARE"
  | "ADMINISTRATIVE"
  | "CLEANLINESS"
  | "FOOD"
  | "STAFF_BEHAVIOR"
  | "OTHER";
export type ComplaintStatus = "OPEN" | "UNDER_INVESTIGATION" | "RESOLVED" | "CLOSED";
export type IncidentStatus = "REPORTED" | "REVIEWED" | "ACTION_TAKEN";
export type AuditStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Complaint = {
  id: number;
  patientId: number | null;
  dateReported: string | null;
  category: ComplaintCategory | null;
  description: string | null;
  status: ComplaintStatus | null;
  resolutionNotes: string | null;
};

export type IncidentReport = {
  id: number;
  reportedBy: number | null;
  incidentDate: string | null;
  reportedDate: string | null;
  location: string | null;
  severity: Severity | null;
  description: string | null;
  immediateActionTaken: string | null;
  status: IncidentStatus | null;
};

export type InternalAudit = {
  id: number;
  auditorId: number | null;
  /** LocalDate cote Java : « 2026-08-01 », sans heure. */
  auditDate: string | null;
  department: string | null;
  title: string | null;
  findings: string | null;
  score: number | null;
  status: AuditStatus | null;
  correctiveActions: string | null;
};

const CATEGORIES: Record<ComplaintCategory, string> = {
  MEDICAL_CARE: "Soins médicaux",
  ADMINISTRATIVE: "Administratif",
  CLEANLINESS: "Propreté",
  FOOD: "Restauration",
  STAFF_BEHAVIOR: "Comportement du personnel",
  OTHER: "Autre",
};

const COMPLAINT_STATUS: Record<ComplaintStatus, string> = {
  OPEN: "Ouverte",
  UNDER_INVESTIGATION: "En instruction",
  RESOLVED: "Résolue",
  CLOSED: "Clôturée",
};

const INCIDENT_STATUS: Record<IncidentStatus, string> = {
  REPORTED: "Signalé",
  REVIEWED: "Analysé",
  ACTION_TAKEN: "Traité",
};

const AUDIT_STATUS: Record<AuditStatus, string> = {
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
};

const SEVERITIES: Record<Severity, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  CRITICAL: "Critique",
};

const libelle = <T extends string>(table: Record<T, string>, valeur: string | null): string =>
  valeur ? (table[valeur as T] ?? valeur) : "—";

export const categoryLabel = (v: string | null) => libelle(CATEGORIES, v);
export const complaintStatusLabel = (v: string | null) => libelle(COMPLAINT_STATUS, v);
export const incidentStatusLabel = (v: string | null) => libelle(INCIDENT_STATUS, v);
export const auditStatusLabel = (v: string | null) => libelle(AUDIT_STATUS, v);
export const severityLabel = (v: string | null) => libelle(SEVERITIES, v);

/**
 * Couleurs de gravite : une echelle croissante, distincte des couleurs de statut. Une gravite
 * critique doit se voir sans lire, c'est tout l'interet d'un tableau d'incidents.
 */
export const SEVERITY_CLASSES: Record<Severity, string> = {
  LOW: "bg-neutral-100 text-neutral-600",
  MEDIUM: "bg-tertiary-50 text-tertiary-700",
  HIGH: "bg-accent-50 text-accent-700",
  CRITICAL: "bg-accent-500 text-white",
};

/** Les statuts « terminal » se lisent en neutre, les statuts actifs en couleur de marque. */
export const COMPLAINT_STATUS_CLASSES: Record<ComplaintStatus, string> = {
  OPEN: "bg-accent-50 text-accent-700",
  UNDER_INVESTIGATION: "bg-tertiary-50 text-tertiary-700",
  RESOLVED: "bg-primary-50 text-primary-700",
  CLOSED: "bg-neutral-100 text-neutral-600",
};

export const INCIDENT_STATUS_CLASSES: Record<IncidentStatus, string> = {
  REPORTED: "bg-accent-50 text-accent-700",
  REVIEWED: "bg-tertiary-50 text-tertiary-700",
  ACTION_TAKEN: "bg-primary-50 text-primary-700",
};

export const AUDIT_STATUS_CLASSES: Record<AuditStatus, string> = {
  PLANNED: "bg-tertiary-50 text-tertiary-700",
  IN_PROGRESS: "bg-primary-50 text-primary-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
};

export const fetchComplaints = (token: string) => apiGet<Complaint[]>("/quality/complaint", token);
export const fetchIncidents = (token: string) => apiGet<IncidentReport[]>("/quality/incident", token);
export const fetchAudits = (token: string) => apiGet<InternalAudit[]>("/quality/audit", token);
