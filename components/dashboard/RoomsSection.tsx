"use client";

import RoomActions from "@/components/dashboard/RoomActions";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { montant } from "@/lib/billing";
import { ROOM_STATUS_CLASSES, fetchRooms, litOccupe, roomStatusLabel, type Room } from "@/lib/rooms";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Etat des chambres, lits compris.
 *
 * Les lits sont montres un par un et non resumes en « 2/4 occupes » : un soignant cherche un lit
 * nommement, et le numero de patient occupant doit se lire sans ouvrir un detail.
 */
const NEUTRE = "bg-neutral-100 text-neutral-600";

export default function RoomsSection({
  cleRafraichissement = 0,
  /**
   * Colonne d'actions. Absente par defaut : la plupart des ecrans ne font que consulter l'etat des
   * chambres, et un role qui n'a pas le droit d'agir ne doit pas voir de boutons qui echoueront.
   */
  avecActions = false,
  onChangement,
}: {
  cleRafraichissement?: number;
  avecActions?: boolean;
  onChangement?: () => void;
}) {
  const etat = useAuthenticatedResource<Room[]>((session) => fetchRooms(session.token), [
    cleRafraichissement,
  ]);

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des chambres…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Chambres indisponibles" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Chambres indisponibles" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucune chambre"
        description="Aucune chambre n'est enregistrée dans l'établissement."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">État des chambres et des lits</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Chambre</th>
            <th scope="col" className="px-4 py-3 font-medium">Catégorie</th>
            <th scope="col" className="px-4 py-3 font-medium">Lits</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Tarif / nuit</th>
            <th scope="col" className="px-4 py-3 font-medium">État</th>
            {avecActions && (
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.donnees.map((chambre) => {
            const lits = chambre.beds ?? [];
            const libres = lits.filter((lit) => !litOccupe(lit)).length;
            return (
              <tr key={chambre.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-medium text-secondary-500">{chambre.roomNumber ?? "—"}</span>
                  {chambre.floorNumber !== null && chambre.floorNumber !== undefined && (
                    <span className="block text-xs text-neutral-500">Étage {chambre.floorNumber}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{chambre.category?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  {lits.length === 0 ? (
                    <span className="text-neutral-500">aucun lit</span>
                  ) : (
                    <>
                      <span className="text-xs text-neutral-500">
                        {libres} libre{libres > 1 ? "s" : ""} sur {lits.length}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {lits.map((lit) => {
                          const occupe = litOccupe(lit);
                          return (
                            <span
                              key={lit.id}
                              className={`rounded px-1.5 py-0.5 text-xs ${
                                occupe ? "bg-neutral-200 text-neutral-700" : "bg-primary-50 text-primary-700"
                              }`}
                              // Le titre porte l'information, la couleur ne fait que la doubler.
                              title={occupe ? `Occupé par le patient #${lit.currentPatientId ?? "?"}` : "Libre"}
                            >
                              {lit.bedNumber ?? "?"}
                              {occupe && lit.currentPatientId !== null ? ` · #${lit.currentPatientId}` : ""}
                            </span>
                          );
                        })}
                      </span>
                    </>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-600">
                  {montant(chambre.category?.pricePerNight ?? null)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                      chambre.status ? (ROOM_STATUS_CLASSES[chambre.status] ?? NEUTRE) : NEUTRE
                    }`}
                  >
                    {roomStatusLabel(chambre.status)}
                  </span>
                </td>
                {avecActions && (
                  <td className="px-4 py-3">
                    <RoomActions chambre={chambre} onChangement={() => onChangement?.()} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
