"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { fetchDepartments, fetchSpecialties, type ConfigItem } from "@/lib/facilities";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Referentiels de la plateforme : services et specialites.
 *
 * Les deux listes sont chargees ensemble parce qu'elles n'ont de sens que cote a cote — ce sont
 * les deux vocabulaires sur lesquels s'appuient les fiches medecin. Un echec sur l'une fait
 * echouer l'ecran : afficher un referentiel incomplet sans le dire serait pire qu'une erreur.
 */
export default function SettingsSection() {
  const etat = useAuthenticatedResource<{ services: ConfigItem[]; specialites: ConfigItem[] }>(
    (session) =>
      Promise.all([fetchDepartments(session.token), fetchSpecialties(session.token)]).then(
        ([services, specialites]) => ({ services, specialites })
      ),
    []
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des référentiels…" />;
  }
  if (etat.phase === "impossible") {
    return <SectionMessage variant="error" title="Référentiels indisponibles" />;
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Référentiels indisponibles" description={etat.message} />;
  }

  const { services, specialites } = etat.donnees;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Referentiel titre="Services" items={services} vide="Aucun service n'est défini." />
      <Referentiel titre="Spécialités" items={specialites} vide="Aucune spécialité n'est définie." />
    </div>
  );
}

function Referentiel({ titre, items, vide }: { titre: string; items: ConfigItem[]; vide: string }) {
  const id = `ref-${titre.toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="rounded-lg border border-neutral-200 bg-white">
      <h2
        id={id}
        className="flex items-baseline gap-2 border-b border-neutral-200 px-5 py-3 font-heading text-base font-semibold text-secondary-500"
      >
        {titre}
        <span className="text-xs font-normal text-neutral-500">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-neutral-500">{vide}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3">
              <span className="text-sm font-medium text-secondary-500">{item.name ?? "—"}</span>
              {item.description && (
                <span className="block text-xs text-neutral-500">{item.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
