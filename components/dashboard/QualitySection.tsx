"use client";

import type { ReactNode } from "react";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { formatDateTime } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import {
  AUDIT_STATUS_CLASSES,
  COMPLAINT_STATUS_CLASSES,
  INCIDENT_STATUS_CLASSES,
  SEVERITY_CLASSES,
  auditStatusLabel,
  categoryLabel,
  complaintStatusLabel,
  fetchAudits,
  fetchComplaints,
  fetchIncidents,
  incidentStatusLabel,
  severityLabel,
  type Complaint,
  type IncidentReport,
  type InternalAudit,
} from "@/lib/quality";

/**
 * Les trois registres du service qualite. Ils partagent le chargement et les etats, mais pas
 * les colonnes : une plainte, un incident et un audit ne decrivent pas les memes faits, les
 * aplatir dans un tableau commun rendrait chacun illisible.
 */
export type RegistreQualite = "complaint" | "incident" | "audit";

const pastille = (classe: string, texte: string) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${classe}`}>
    {texte}
  </span>
);

const NEUTRE = "bg-neutral-100 text-neutral-600";

export default function QualitySection({
  registre,
  cleRafraichissement = 0,
}: { registre: RegistreQualite;
  /** Change de valeur pour forcer un rechargement apres une ecriture. */
  cleRafraichissement?: number;
}) {
  // Le parametre de type est explicite : sans lui, TypeScript infere une union de trois
  // Promise distinctes et refuse de l'unifier avec la signature du hook.
  const etat = useAuthenticatedResource<Complaint[] | IncidentReport[] | InternalAudit[]>(
    (session) => {
      if (registre === "complaint") return fetchComplaints(session.token);
      if (registre === "incident") return fetchIncidents(session.token);
      return fetchAudits(session.token);
    },
    [registre, cleRafraichissement]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Registre indisponible" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Registre indisponible" description={etat.message} />;
  }

  if (registre === "complaint") {
    const plaintes = etat.donnees as Complaint[];
    return (
      <Registre
        vide="Aucune plainte enregistrée."
        colonnes={["Date", "Patient", "Catégorie", "Description", "Statut"]}
        lignes={plaintes.length}
      >
        {plaintes.map((plainte) => (
          <tr key={plainte.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="whitespace-nowrap px-4 py-3 text-secondary-500">{formatDateTime(plainte.dateReported)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
              {plainte.patientId === null ? "—" : `#${plainte.patientId}`}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{categoryLabel(plainte.category)}</td>
            <td className="px-4 py-3 text-neutral-600">{plainte.description ?? "—"}</td>
            <td className="px-4 py-3">
              {pastille(
                plainte.status ? (COMPLAINT_STATUS_CLASSES[plainte.status] ?? NEUTRE) : NEUTRE,
                complaintStatusLabel(plainte.status)
              )}
            </td>
          </tr>
        ))}
      </Registre>
    );
  }

  if (registre === "incident") {
    const incidents = etat.donnees as IncidentReport[];
    return (
      <Registre
        vide="Aucun incident signalé."
        colonnes={["Survenu le", "Lieu", "Gravité", "Description", "Statut"]}
        lignes={incidents.length}
      >
        {incidents.map((incident) => (
          <tr key={incident.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="whitespace-nowrap px-4 py-3 text-secondary-500">{formatDateTime(incident.incidentDate)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{incident.location ?? "—"}</td>
            <td className="px-4 py-3">
              {pastille(
                incident.severity ? (SEVERITY_CLASSES[incident.severity] ?? NEUTRE) : NEUTRE,
                severityLabel(incident.severity)
              )}
            </td>
            <td className="px-4 py-3 text-neutral-600">
              {incident.description ?? "—"}
              {incident.immediateActionTaken && (
                <span className="block text-xs text-neutral-500">
                  Action immédiate : {incident.immediateActionTaken}
                </span>
              )}
            </td>
            <td className="px-4 py-3">
              {pastille(
                incident.status ? (INCIDENT_STATUS_CLASSES[incident.status] ?? NEUTRE) : NEUTRE,
                incidentStatusLabel(incident.status)
              )}
            </td>
          </tr>
        ))}
      </Registre>
    );
  }

  const audits = etat.donnees as InternalAudit[];
  return (
    <Registre
      vide="Aucun audit planifié."
      colonnes={["Date", "Service", "Intitulé", "Score", "Statut"]}
      lignes={audits.length}
    >
      {audits.map((audit) => (
        <tr key={audit.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
          {/* auditDate est un LocalDate : pas d'heure a afficher. */}
          <td className="whitespace-nowrap px-4 py-3 text-secondary-500">{formatDateTime(audit.auditDate, false)}</td>
          <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{audit.department ?? "—"}</td>
          <td className="px-4 py-3">
            <span className="font-medium text-secondary-500">{audit.title ?? "—"}</span>
            {audit.findings && <span className="block text-xs text-neutral-500">{audit.findings}</span>}
          </td>
          {/* Un score nul se distingue d'un score de zero : le premier n'a pas ete releve. */}
          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">
            {audit.score === null || audit.score === undefined ? "—" : `${audit.score} / 100`}
          </td>
          <td className="px-4 py-3">
            {pastille(
              audit.status ? (AUDIT_STATUS_CLASSES[audit.status] ?? NEUTRE) : NEUTRE,
              auditStatusLabel(audit.status)
            )}
          </td>
        </tr>
      ))}
    </Registre>
  );
}

function Registre({
  colonnes,
  lignes,
  vide,
  children,
}: {
  colonnes: string[];
  lignes: number;
  vide: string;
  children: ReactNode;
}) {
  if (lignes === 0) {
    return <SectionMessage variant="empty" title="Registre vide" description={vide} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {colonnes.map((colonne) => (
              <th key={colonne} scope="col" className="px-4 py-3 font-medium">
                {colonne}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
}
