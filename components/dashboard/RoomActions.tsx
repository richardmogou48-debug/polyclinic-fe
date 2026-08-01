"use client";

import { BoutonLigne, useAction } from "@/components/dashboard/ActionsRapides";
import { basculerMaintenance, litOccupe, marquerNettoyee, type Room } from "@/lib/rooms";

/**
 * Actions sur une chambre : signaler nettoyee, mettre en maintenance ou l'en sortir.
 *
 * Chaque action n'apparait QUE si elle peut aboutir, parce que le backend refuse les autres — et
 * refuse mal : RoomService leve une RuntimeException, que RoomMS rend en erreur 500 faute de
 * gestionnaire. L'utilisateur lirait donc « erreur serveur » la ou il s'agit d'une regle de
 * gestion parfaitement normale. Les conditions reproduites ici sont exactement celles du service :
 *
 * - marquer nettoyee n'est accepte que sur une chambre en etat CLEANING
 *   (« Room is not in CLEANING state ») ;
 * - la mise en maintenance est refusee des qu'un lit est occupe
 *   (« Cannot put a partially or fully occupied room into maintenance »).
 *
 * Cette duplication de regle est un pis-aller assume : la corriger durablement demande que RoomMS
 * leve des ResponseStatusException et expose ses motifs, comme le fait desormais
 * MedicalRecordMS.
 */
export default function RoomActions({
  chambre,
  onChangement,
}: {
  chambre: Room;
  onChangement: () => void;
}) {
  const { executer, enCours, erreur } = useAction(onChangement);

  const enMaintenance = chambre.status === "MAINTENANCE";
  const enNettoyage = chambre.status === "CLEANING";
  const litsOccupes = (chambre.beds ?? []).some(litOccupe);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        {enNettoyage && (
          <BoutonLigne
            onClick={() => executer("nettoyee", (token) => marquerNettoyee(chambre.id, token))}
            disabled={enCours !== null}
          >
            {enCours === "nettoyee" ? "…" : "Nettoyage terminé"}
          </BoutonLigne>
        )}

        {enMaintenance ? (
          <BoutonLigne
            onClick={() => executer("sortie", (token) => basculerMaintenance(chambre.id, false, token))}
            disabled={enCours !== null}
          >
            {enCours === "sortie" ? "…" : "Sortir de maintenance"}
          </BoutonLigne>
        ) : (
          !litsOccupes && (
            <BoutonLigne
              onClick={() => executer("maintenance", (token) => basculerMaintenance(chambre.id, true, token))}
              disabled={enCours !== null}
              danger
            >
              {enCours === "maintenance" ? "…" : "Mettre en maintenance"}
            </BoutonLigne>
          )
        )}

        {/* Aucune action possible n'est un etat normal — une chambre occupee et disponible n'a
            rien a signaler. Le dire evite de chercher un bouton qui n'existe pas. */}
        {!enNettoyage && !enMaintenance && litsOccupes && (
          <span className="text-xs text-neutral-500">Occupée</span>
        )}
      </div>

      {erreur && (
        <p role="alert" className="text-xs font-medium text-accent-700">
          {erreur}
        </p>
      )}
    </div>
  );
}
