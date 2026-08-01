"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { montant } from "@/lib/billing";
import { fetchMedicines, medicineCategoryLabel, medicineTypeLabel } from "@/lib/pharmacy";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import type { Medicine } from "@/lib/pharmacy";

/** Catalogue des medicaments referencés. */
export default function MedicinesSection() {
  const etat = useAuthenticatedResource<Medicine[]>((session) => fetchMedicines(session.token));

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du catalogue…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Catalogue indisponible" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Catalogue indisponible" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Catalogue vide"
        description="Aucun médicament n'est encore référencé."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Médicaments référencés</caption>
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Médicament</th>
            <th scope="col" className="px-4 py-3 font-medium">Forme</th>
            <th scope="col" className="px-4 py-3 font-medium">Catégorie</th>
            <th scope="col" className="px-4 py-3 font-medium">Laboratoire</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Prix unitaire</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {etat.donnees.map((medicament) => (
            <tr key={medicament.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
              <td className="px-4 py-3">
                <span className="font-medium text-secondary-500">{medicament.name ?? "—"}</span>
                {medicament.dosage && (
                  <span className="block text-xs text-neutral-500">{medicament.dosage}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{medicineTypeLabel(medicament.type)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                {medicineCategoryLabel(medicament.category)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{medicament.manufacturer ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-secondary-500">
                {montant(medicament.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
