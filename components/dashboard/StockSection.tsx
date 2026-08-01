"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { formatDateTime } from "@/lib/medicalRecords";
import { fetchInventory, type InventoryLot } from "@/lib/pharmacy";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Etat du stock, lot par lot.
 *
 * L'echeance est calculee ici et non cote backend : c'est un jugement d'affichage — a partir de
 * quand un lot merite l'attention — qui n'a pas a etre fige dans le modele. Le seuil de trois
 * mois vaut pour un stock pharmaceutique courant ; il se change ici seul.
 */
const JOURS_ALERTE = 90;

type Echeance = { classe: string; mention: string | null };

function echeance(dateIso: string | null): Echeance {
  if (!dateIso) {
    return { classe: "text-neutral-500", mention: null };
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return { classe: "text-neutral-500", mention: null };
  }
  const jours = Math.floor((date.getTime() - Date.now()) / 86_400_000);
  if (jours < 0) {
    return { classe: "text-accent-700 font-medium", mention: "périmé" };
  }
  if (jours <= JOURS_ALERTE) {
    return { classe: "text-tertiary-700 font-medium", mention: `dans ${jours} j` };
  }
  return { classe: "text-neutral-600", mention: null };
}

export default function StockSection() {
  const etat = useAuthenticatedResource<InventoryLot[]>((session) => fetchInventory(session.token));

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du stock…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Stock indisponible" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Stock indisponible" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Stock vide"
        description="Aucun lot n'est enregistré en stock."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Lots en stock, péremption la plus proche d&apos;abord</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Médicament</th>
            <th scope="col" className="px-4 py-3 font-medium">Lot</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Quantité</th>
            <th scope="col" className="px-4 py-3 font-medium">Péremption</th>
            <th scope="col" className="px-4 py-3 font-medium">Entré le</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.donnees.map((lot) => {
            const etatDate = echeance(lot.expiryDate);
            return (
              <tr key={lot.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-secondary-500">{lot.medicineName ?? "—"}</span>
                  {lot.dosage && <span className="block text-xs text-neutral-500">{lot.dosage}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {lot.batchNo ? (
                    <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-secondary-500">{lot.batchNo}</code>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-secondary-500">
                  {lot.quantity ?? "—"}
                </td>
                {/* La mention textuelle porte l'alerte ; la couleur ne fait que la doubler. */}
                <td className={`whitespace-nowrap px-4 py-3 ${etatDate.classe}`}>
                  {formatDateTime(lot.expiryDate, false)}
                  {etatDate.mention && <span className="ml-2 text-xs">{etatDate.mention}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                  {formatDateTime(lot.addedDate, false)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
