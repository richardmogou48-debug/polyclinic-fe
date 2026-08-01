"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import {
  EQUIPMENT_STATUS_CLASSES,
  TASK_STATUS_CLASSES,
  disposalLabel,
  equipmentStatusLabel,
  equipmentTypeLabel,
  fetchCleaningTasks,
  fetchEquipment,
  fetchWasteLogs,
  taskStatusLabel,
  taskTypeLabel,
  wasteTypeLabel,
  type CleaningTask,
  type Equipment,
  type WasteLog,
} from "@/lib/facilities";
import { formatDateTime } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/** Registres du plateau technique. */
export type RegistreTechnique = "equipements" | "nettoyage" | "dechets";

const NEUTRE = "bg-neutral-100 text-neutral-600";

const pastille = (classe: string, texte: string) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${classe}`}>
    {texte}
  </span>
);

export default function FacilitiesSection({
  registre,
  cleRafraichissement = 0,
}: { registre: RegistreTechnique;
  /** Change de valeur pour forcer un rechargement apres une ecriture. */
  cleRafraichissement?: number;
}) {
  const etat = useAuthenticatedResource<Equipment[] | CleaningTask[] | WasteLog[]>(
    (session) => {
      if (registre === "equipements") return fetchEquipment(session.token);
      if (registre === "nettoyage") return fetchCleaningTasks(session.token);
      return fetchWasteLogs(session.token);
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

  if (registre === "equipements") {
    const parc = etat.donnees as Equipment[];
    if (parc.length === 0) {
      return <SectionMessage variant="empty" title="Parc vide" description="Aucun équipement n'est référencé." />;
    }
    return (
      <Tableau colonnes={["Équipement", "Type", "Emplacement", "Prochaine maintenance", "État"]} legende="Parc d'équipements">
        {parc.map((materiel) => (
          <tr key={materiel.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="px-4 py-3">
              <span className="font-medium text-secondary-500">{materiel.name ?? "—"}</span>
              {materiel.serialNumber && (
                <span className="block text-xs text-neutral-500">N° {materiel.serialNumber}</span>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{equipmentTypeLabel(materiel.type)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{materiel.currentLocation ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
              {formatDateTime(materiel.nextPreventiveMaintenanceDate, false)}
              {materiel.nextCalibrationDate && (
                <span className="block text-xs text-neutral-500">
                  Étalonnage {formatDateTime(materiel.nextCalibrationDate, false)}
                </span>
              )}
            </td>
            <td className="px-4 py-3">
              {pastille(
                materiel.status ? (EQUIPMENT_STATUS_CLASSES[materiel.status] ?? NEUTRE) : NEUTRE,
                equipmentStatusLabel(materiel.status)
              )}
            </td>
          </tr>
        ))}
      </Tableau>
    );
  }

  if (registre === "nettoyage") {
    const taches = etat.donnees as CleaningTask[];
    if (taches.length === 0) {
      return <SectionMessage variant="empty" title="Aucune tâche" description="Aucune tâche de nettoyage n'est programmée." />;
    }
    return (
      <Tableau colonnes={["Programmée le", "Lieu", "Nature", "Réalisée par", "Statut"]} legende="Tâches de nettoyage">
        {taches.map((tache) => (
          <tr key={tache.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
            <td className="whitespace-nowrap px-4 py-3 text-secondary-500">{formatDateTime(tache.scheduledDate)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{tache.location ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{taskTypeLabel(tache.taskType)}</td>
            <td className="px-4 py-3 text-neutral-600">
              {tache.performedBy ?? "—"}
              {tache.completedDate && (
                <span className="block text-xs text-neutral-500">le {formatDateTime(tache.completedDate)}</span>
              )}
            </td>
            <td className="px-4 py-3">
              {pastille(
                tache.status ? (TASK_STATUS_CLASSES[tache.status] ?? NEUTRE) : NEUTRE,
                taskStatusLabel(tache.status)
              )}
            </td>
          </tr>
        ))}
      </Tableau>
    );
  }

  const dechets = etat.donnees as WasteLog[];
  if (dechets.length === 0) {
    return <SectionMessage variant="empty" title="Aucune collecte" description="Aucun enlèvement de déchets n'est enregistré." />;
  }
  return (
    <Tableau
      colonnes={["Collecté le", "Nature", "Quantité", "Lieu", "Élimination", "Bordereau"]}
      legende="Registre des déchets biomédicaux"
    >
      {dechets.map((collecte) => (
        <tr key={collecte.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
          <td className="whitespace-nowrap px-4 py-3 text-secondary-500">{formatDateTime(collecte.collectionDate)}</td>
          <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{wasteTypeLabel(collecte.wasteType)}</td>
          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">
            {collecte.quantityKg === null || collecte.quantityKg === undefined ? "—" : `${collecte.quantityKg} kg`}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{collecte.location ?? "—"}</td>
          <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{disposalLabel(collecte.disposalMethod)}</td>
          {/* Le bordereau est une exigence reglementaire : son absence doit se voir. */}
          <td className="whitespace-nowrap px-4 py-3">
            {collecte.disposalCertificateRef ? (
              <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-secondary-500">
                {collecte.disposalCertificateRef}
              </code>
            ) : (
              <span className="text-xs font-medium text-accent-700">manquant</span>
            )}
          </td>
        </tr>
      ))}
    </Tableau>
  );
}

function Tableau({
  colonnes,
  legende,
  children,
}: {
  colonnes: string[];
  legende: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{legende}</caption>
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
