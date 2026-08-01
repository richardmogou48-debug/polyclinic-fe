"use client";

import { useState } from "react";
import ExamResultForm from "@/components/dashboard/ExamResultForm";
import SectionMessage from "@/components/dashboard/SectionMessage";
import Modal, { BoutonAction } from "@/components/form/Modal";
import { examCategoryLabel, fetchPendingExams, formatDateTime } from "@/lib/medicalRecords";
import type { ExamRequestView } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * File du plateau technique : les examens demandes qui n'ont pas rendu.
 *
 * Cette file dit reellement « ce qui reste a faire », a la difference de celle des ordonnances :
 * la demande porte un statut, et il bascule a l'enregistrement du resultat. Le tri vient du
 * backend — urgents d'abord, puis par anciennete — et n'est pas refait ici : le reproduire cote
 * client laisserait deux ordres diverger a la premiere modification.
 *
 * Chaque resultat rendu leve le verrou qui empeche de prescrire des medicaments sur la
 * consultation correspondante. C'est ce qui fait de cet ecran un maillon du parcours et non une
 * simple liste.
 */
export default function PendingExamsWorkspace() {
  const [examen, setExamen] = useState<ExamRequestView | null>(null);
  const [rafraichissements, setRafraichissements] = useState(0);

  const file = useAuthenticatedResource(
    (session) => fetchPendingExams(session.token),
    [rafraichissements]
  );

  if (file.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des examens…" />;
  }

  if (file.phase === "erreur") {
    return <SectionMessage variant="error" title="File indisponible" description={file.message} />;
  }

  if (file.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="File indisponible"
        description="Les examens en attente n'ont pas pu être interrogés."
      />
    );
  }

  if (file.donnees.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun examen en attente"
        description="Tous les examens demandés ont rendu leur résultat."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Examens en attente de résultat</caption>
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Examen</th>
              <th scope="col" className="px-4 py-3 font-medium">Nature</th>
              <th scope="col" className="px-4 py-3 font-medium">Patient</th>
              <th scope="col" className="px-4 py-3 font-medium">Demandé le</th>
              <th scope="col" className="px-4 py-3 font-medium">Indication</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {file.donnees.map((demande) => (
              <tr key={demande.id} className="transition-colors duration-250 ease-smooth hover:bg-neutral-50">
                <td className="px-5 py-3 font-medium text-secondary-500">
                  {demande.label ?? "Examen non nommé"}
                  {demande.urgent && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                      Urgent
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                  {examCategoryLabel(demande.category)}
                </td>
                {/* Le patient est identifie par sa fiche : la file ne porte pas les noms, et
                    aller les chercher un par un ferait autant d'appels que de lignes. */}
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                  Fiche {demande.patientId ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                  {formatDateTime(demande.requestedAt)}
                </td>
                <td className="px-4 py-3 text-neutral-600">{demande.clinicalIndication ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <BoutonAction onClick={() => setExamen(demande)}>Rendre le résultat</BoutonAction>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        ouverte={examen !== null}
        titre="Rendre un résultat"
        onFermer={() => {
          setExamen(null);
          // Rafraichir a la fermeture et non a l'enregistrement : la modale reste ouverte apres
          // le succes pour que le soignant relise ce qu'il a saisi, et retirer la ligne sous ses
          // yeux donnerait l'impression que quelque chose a ete perdu.
          setRafraichissements((n) => n + 1);
        }}
      >
        {examen && (
          <ExamResultForm dansModale examId={examen.id} libelleExamen={examen.label ?? undefined} />
        )}
      </Modal>
    </>
  );
}
