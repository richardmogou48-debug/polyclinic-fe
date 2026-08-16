"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import {
  fetchPrescriptionsByPatient,
  fetchRecentPrescriptions,
  formatDateTime,
  type PrescriptionView,
} from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Ordonnances.
 *
 * `portee` « etablissement » lit la file de la pharmacie, « propre » celles du titulaire de la
 * session — un patient consultant les siennes.
 *
 * RESERVE IMPORTANTE, reprise du backend : cette liste rend les ordonnances RECENTES, pas
 * « celles a delivrer ». Prescription ne porte aucun etat de delivrance. L'intitule du menu
 * pharmacien parle de prescriptions a delivrer ; l'ecran ne le promet pas, et l'annonce
 * explicitement, plutot que de laisser croire a une file d'attente qui se viderait.
 */
export type PorteeOrdonnances = "etablissement" | "propre";

export default function PrescriptionsSection({ portee }: { portee: PorteeOrdonnances }) {
  const etat = useAuthenticatedResource<PrescriptionView[]>(
    (session) => {
      if (portee === "etablissement") {
        return fetchRecentPrescriptions(session.token);
      }
      return session.profileId
        ? fetchPrescriptionsByPatient(Number(session.profileId), session.token)
        : null;
    },
    [portee]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des ordonnances…" />;
  }
  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Aucune fiche patient associée"
        description="Ce compte n'a pas de fiche patient, ses ordonnances ne peuvent donc pas être retrouvées."
      />
    );
  }
  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Ordonnances indisponibles" description={etat.message} />;
  }
  if (etat.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucune ordonnance"
        description={
          portee === "etablissement"
            ? "Aucune ordonnance n'a encore été émise."
            : "Aucune ordonnance n'a encore été émise à votre nom."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {portee === "etablissement" && (
        <p className="rounded-md border border-tertiary-200 bg-tertiary-50 px-4 py-2 text-sm text-tertiary-700">
          Ordonnances les plus récentes. Le suivi de délivrance n&apos;est pas encore géré : rien ne
          distingue ici une ordonnance déjà servie d&apos;une ordonnance en attente.
        </p>
      )}

      {etat.donnees.map((ordonnance) => {
        const lignes = ordonnance.items ?? [];
        return (
          <article key={ordonnance.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
              <h2 className="font-heading text-base font-semibold text-secondary-500">
                Ordonnance n° {ordonnance.id}
              </h2>
              <span className="text-xs text-neutral-500">{formatDateTime(ordonnance.issueDate)}</span>
              {portee === "etablissement" && ordonnance.patientId !== null && (
                <span className="text-xs text-neutral-500">Patient #{ordonnance.patientId}</span>
              )}
              {ordonnance.diagnosis && (
                <span className="ml-auto text-xs text-neutral-600">{ordonnance.diagnosis}</span>
              )}
              {ordonnance.patientId !== null && (
                <a
                  href={`/print/ordonnance/${ordonnance.patientId}/${ordonnance.id}`}
                  target="_blank"
                  rel="noopener"
                  className={`${ordonnance.diagnosis ? "" : "ml-auto "}whitespace-nowrap text-xs font-medium text-primary-700 underline-offset-2 hover:underline`}
                >
                  Imprimer
                </a>
              )}
            </header>

            {lignes.length === 0 ? (
              <p className="px-5 py-3 text-sm text-neutral-500">Aucune ligne de prescription.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {lignes.map((ligne) => (
                  <li key={ligne.id} className="px-5 py-3 text-sm">
                    <span className="font-medium text-secondary-500">
                      {ligne.medicineName ?? "Médicament non nommé"}
                    </span>
                    <span className="block text-neutral-600">
                      {ligne.dosage ?? "Posologie non précisée"}
                      {ligne.duration ? ` — ${ligne.duration}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
