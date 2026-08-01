"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import {
  fetchMedicalRecord,
  formatDateTime,
  mesure,
  surgeryStatusLabel,
  type SurgeryStatus,
} from "@/lib/medicalRecords";

/**
 * Dossier medical d'un patient.
 *
 * `patientId` absent = le dossier de l'utilisateur connecte, lu depuis sa session. Le fournir
 * explicitement sert aux ecrans soignants (medecin, infirmiere), que MedicalRecordAccessFilter
 * autorise sur n'importe quel patient. Un patient qui passerait l'identifiant d'un autre
 * obtiendrait un 403 du backend, pas une fuite.
 */
const CLASSES_STATUT_CHIRURGIE: Record<SurgeryStatus, string> = {
  SCHEDULED: "bg-tertiary-50 text-tertiary-700",
  IN_PROGRESS: "bg-primary-50 text-primary-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
};

export default function MedicalRecordSection({ patientId }: { patientId?: number }) {
  // Sans identifiant explicite, on lit le dossier du titulaire de la session. Un compte cree
  // directement en base n'a pas de fiche ProfileMS, donc pas de dossier identifiable : rendre
  // null bascule en « impossible » plutot que d'interroger un identifiant absent.
  const etat = useAuthenticatedResource(
    (session) => {
      const cible = patientId ?? (session.profileId ? Number(session.profileId) : null);
      return cible === null ? null : fetchMedicalRecord(cible, session.token);
    },
    [patientId]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du dossier…" />;
  }

  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Aucune fiche patient associée"
        description="Ce compte n'a pas de fiche patient, son dossier médical ne peut donc pas être identifié. Contactez l'accueil."
      />
    );
  }

  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Dossier indisponible" description={etat.message} />;
  }

  const dossier = etat.donnees;
  // Le backend cree le dossier a la premiere lecture : il existe toujours, mais peut etre vide.
  // Ses collections arrivent a null, pas a [].
  const consultations = dossier.entries ?? [];
  const constantes = dossier.vitalSigns ?? [];
  const interventions = dossier.surgeries ?? [];
  const synthese = [
    { libelle: "Groupe sanguin", valeur: dossier.bloodType },
    { libelle: "Allergies", valeur: dossier.allergies },
    { libelle: "Maladies chroniques", valeur: dossier.chronicDiseases },
    { libelle: "Antécédents familiaux", valeur: dossier.familyHistory },
  ];
  const dossierVide =
    synthese.every((c) => !c.valeur) && !consultations.length && !constantes.length && !interventions.length;

  if (dossierVide) {
    return (
      <SectionMessage
        variant="empty"
        title="Dossier médical vide"
        description="Aucune consultation, constante ni intervention n'a encore été enregistrée à votre nom."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Synthèse : ce qu'un soignant doit voir en premier, allergies comprises. */}
      <section aria-labelledby="synthese" className="rounded-lg border border-neutral-200 bg-white">
        <h2 id="synthese" className="border-b border-neutral-200 px-5 py-3 font-heading text-base font-semibold text-secondary-500">
          Synthèse
        </h2>
        <dl className="grid gap-x-8 gap-y-4 px-5 py-4 sm:grid-cols-2">
          {synthese.map((champ) => (
            <div key={champ.libelle}>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{champ.libelle}</dt>
              <dd className="mt-0.5 text-sm text-secondary-500">{champ.valeur || "Non renseigné"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Bloc titre="Consultations" compte={consultations.length} vide="Aucune consultation enregistrée.">
        <ol className="flex flex-col gap-4 px-5 py-4">
          {consultations.map((entree) => (
            <li key={entree.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {formatDateTime(entree.consultationDate)}
              </p>
              <p className="mt-1 font-medium text-secondary-500">{entree.diagnosis || "Diagnostic non renseigné"}</p>
              {entree.symptoms && <p className="mt-1 text-sm text-neutral-600">Symptômes : {entree.symptoms}</p>}
              {entree.treatmentPlan && (
                <p className="mt-1 text-sm text-neutral-600">Traitement : {entree.treatmentPlan}</p>
              )}
              {entree.additionalNotes && (
                <p className="mt-1 text-sm text-neutral-500">{entree.additionalNotes}</p>
              )}

              {entree.prescription?.items?.length ? (
                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Ordonnance</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {entree.prescription.items.map((ligne) => (
                      <li key={ligne.id} className="text-sm text-secondary-500">
                        {ligne.medicineName ?? "Médicament non nommé"}
                        <span className="text-neutral-500">
                          {ligne.dosage ? ` — ${ligne.dosage}` : ""}
                          {ligne.duration ? `, ${ligne.duration}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </Bloc>

      <Bloc titre="Constantes" compte={constantes.length} vide="Aucun relevé de constantes.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Relevés de constantes</caption>
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Tension</th>
                <th scope="col" className="px-4 py-3 font-medium">Pouls</th>
                <th scope="col" className="px-4 py-3 font-medium">Température</th>
                <th scope="col" className="px-4 py-3 font-medium">Saturation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {constantes.map((releve) => (
                <tr key={releve.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-secondary-500">{formatDateTime(releve.timestamp)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{releve.bloodPressure ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{mesure(releve.heartRate, "bpm")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{mesure(releve.temperature, "°C")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{mesure(releve.oxygenSaturation, "%")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloc>

      <Bloc titre="Interventions" compte={interventions.length} vide="Aucune intervention chirurgicale.">
        <ul className="flex flex-col gap-3 px-5 py-4">
          {interventions.map((operation) => (
            <li key={operation.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-medium text-secondary-500">{operation.procedureName ?? "Intervention"}</span>
              <span className="text-sm text-neutral-500">{formatDateTime(operation.scheduledDate, false)}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  operation.status
                    ? (CLASSES_STATUT_CHIRURGIE[operation.status] ?? "bg-neutral-100 text-neutral-600")
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {surgeryStatusLabel(operation.status)}
              </span>
            </li>
          ))}
        </ul>
      </Bloc>
    </div>
  );
}

/** Encadre une section du dossier, et rend son absence explicite plutot que de la masquer. */
function Bloc({
  titre,
  compte,
  vide,
  children,
}: {
  titre: string;
  compte: number;
  vide: string;
  children: React.ReactNode;
}) {
  const id = `bloc-${titre.toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="rounded-lg border border-neutral-200 bg-white">
      <h2
        id={id}
        className="flex items-baseline gap-2 border-b border-neutral-200 px-5 py-3 font-heading text-base font-semibold text-secondary-500"
      >
        {titre}
        <span className="text-xs font-normal text-neutral-500">{compte}</span>
      </h2>
      {compte === 0 ? <p className="px-5 py-4 text-sm text-neutral-500">{vide}</p> : children}
    </section>
  );
}
