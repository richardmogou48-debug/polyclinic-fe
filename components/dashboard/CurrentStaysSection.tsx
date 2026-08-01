"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { formatDateTime } from "@/lib/medicalRecords";
import { fetchCurrentStays, type CurrentStay } from "@/lib/rooms";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Patients actuellement hospitalises.
 *
 * La duree de sejour est calculee a l'affichage plutot que renvoyee par le backend : elle change
 * a chaque heure qui passe, la figer dans une reponse la rendrait fausse des sa lecture.
 */
function duree(admissionIso: string | null): string {
  if (!admissionIso) {
    return "—";
  }
  const debut = new Date(admissionIso);
  if (Number.isNaN(debut.getTime())) {
    return "—";
  }
  const heures = Math.floor((Date.now() - debut.getTime()) / 3_600_000);
  if (heures < 24) {
    return `${Math.max(heures, 0)} h`;
  }
  const jours = Math.floor(heures / 24);
  return `${jours} jour${jours > 1 ? "s" : ""}`;
}

export default function CurrentStaysSection() {
  const etat = useAuthenticatedResource<CurrentStay[]>((session) => fetchCurrentStays(session.token));

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des séjours…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Séjours indisponibles" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Séjours indisponibles" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun patient hospitalisé"
        description="Aucun lit n'est actuellement occupé."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Patients actuellement hospitalisés</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Patient</th>
            <th scope="col" className="px-4 py-3 font-medium">Chambre</th>
            <th scope="col" className="px-4 py-3 font-medium">Lit</th>
            <th scope="col" className="px-4 py-3 font-medium">Admis le</th>
            <th scope="col" className="px-4 py-3 font-medium">Durée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.donnees.map((sejour) => (
            <tr key={sejour.historyId} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
              {/* RoomMS ne resout pas les noms de patients : la reference est affichee telle
                  quelle plutot que d'ajouter un appel par ligne a ProfileMS. */}
              <td className="whitespace-nowrap px-4 py-3 font-medium text-secondary-500">
                {sejour.patientId === null ? "—" : `#${sejour.patientId}`}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="text-secondary-500">{sejour.roomNumber ?? "—"}</span>
                {sejour.floorNumber !== null && sejour.floorNumber !== undefined && (
                  <span className="block text-xs text-neutral-500">
                    Étage {sejour.floorNumber}
                    {sejour.categoryName ? ` · ${sejour.categoryName}` : ""}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{sejour.bedNumber ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                {formatDateTime(sejour.admissionDate)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-600">
                {duree(sejour.admissionDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
