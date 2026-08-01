"use client";

import SectionMessage from "@/components/dashboard/SectionMessage";
import { formatDateTime } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";
import {
  INVOICE_STATUS_CLASSES,
  fetchInvoices,
  fetchInvoicesByPatient,
  invoiceStatusLabel,
  montant,
  paymentMethodLabel,
  type Invoice,
} from "@/lib/billing";

/**
 * Factures, vues par le patient ou par le personnel.
 *
 * `portee` decide de la route appelee, et donc de ce que le backend accepte : « propre » lit
 * les factures du titulaire de la session, « globale » toutes celles de l'etablissement. Un
 * role PATIENT sur la portee globale obtiendrait un 403, ce qui est le comportement voulu —
 * cette portee n'est cablee que sur les ecrans du personnel.
 */
export type PorteeFactures = "propre" | "globale";

const NEUTRE = "bg-neutral-100 text-neutral-600";

export default function InvoicesSection({
  portee,
  cleRafraichissement = 0,
}: { portee: PorteeFactures;
  /** Change de valeur pour forcer un rechargement apres une ecriture. */
  cleRafraichissement?: number;
}) {
  const etat = useAuthenticatedResource<Invoice[]>(
    (session) => {
      if (portee === "globale") {
        return fetchInvoices(session.token);
      }
      // Un compte sans fiche patient n'a pas d'identifiant de facturation.
      return session.profileId ? fetchInvoicesByPatient(Number(session.profileId), session.token) : null;
    },
    [portee, cleRafraichissement]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des factures…" />;
  }

  if (etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Aucune fiche patient associée"
        description="Ce compte n'a pas de fiche patient, ses factures ne peuvent donc pas être retrouvées. Contactez l'accueil."
      />
    );
  }

  if (etat.phase === "erreur") {
    return <SectionMessage variant="error" title="Factures indisponibles" description={etat.message} />;
  }

  const factures = etat.donnees;

  if (factures.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucune facture"
        description={
          portee === "propre"
            ? "Aucune facture n'a encore été émise à votre nom."
            : "Aucune facture n'a encore été émise."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {factures.map((facture) => {
        const postes = facture.items ?? [];
        const reglements = facture.payments ?? [];
        const solde = facture.balanceDue;
        return (
          <article key={facture.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
              <h2 className="font-heading text-base font-semibold text-secondary-500">
                Facture n° {facture.id}
              </h2>
              <span className="text-xs text-neutral-500">
                Émise le {formatDateTime(facture.issueDate, false)}
                {facture.dueDate && ` · échéance ${formatDateTime(facture.dueDate, false)}`}
              </span>
              <span
                className={`ml-auto inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                  facture.status ? (INVOICE_STATUS_CLASSES[facture.status] ?? NEUTRE) : NEUTRE
                }`}
              >
                {invoiceStatusLabel(facture.status)}
              </span>
            </header>

            {postes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Postes de la facture n° {facture.id}</caption>
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th scope="col" className="px-5 py-2 font-medium">Prestation</th>
                      <th scope="col" className="px-4 py-2 font-medium">Qté</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Prix unitaire</th>
                      <th scope="col" className="px-5 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {postes.map((poste) => (
                      <tr key={poste.id}>
                        <td className="px-5 py-2 text-secondary-500">{poste.description ?? "—"}</td>
                        <td className="px-4 py-2 tabular-nums text-neutral-600">{poste.quantity ?? "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-neutral-600">
                          {montant(poste.unitPrice)}
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums text-secondary-500">
                          {montant(poste.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <dl className="grid gap-x-8 gap-y-2 border-t border-neutral-200 px-5 py-4 sm:grid-cols-2">
              <Ligne libelle="Total" valeur={montant(facture.totalAmount)} />
              <Ligne libelle="Déjà réglé" valeur={montant(facture.paidAmount)} />
              <Ligne libelle="Remise" valeur={montant(facture.discountAmount)} />
              <Ligne libelle="Prise en charge assurance" valeur={montant(facture.insuranceCoverageAmount)} />
              {/* Le solde vient du backend : il n'est jamais recalcule ici, la precision des
                  nombres JSON ne s'y prete pas. */}
              <div className="sm:col-span-2 flex items-baseline justify-between border-t border-neutral-200 pt-2">
                <dt className="text-sm font-medium text-secondary-500">Reste à payer</dt>
                <dd
                  className={`text-base font-semibold tabular-nums ${
                    solde !== null && solde !== undefined && solde !== 0
                      ? "text-accent-700"
                      : "text-primary-700"
                  }`}
                >
                  {montant(solde)}
                </dd>
              </div>

              {/* Un solde negatif est arithmetiquement impossible depuis que BillingService borne
                  les reglements et la prise en charge. S'il s'en presente un, la facture est
                  anterieure a cette correction ou a ete ecrite hors du service. Le signaler est
                  tout l'interet d'avoir laisse getBalanceDue rendre la valeur reelle plutot que de
                  la ramener a zero : affiche en vert comme un solde nul, il passait inapercu. */}
              {solde !== null && solde !== undefined && solde < 0 && (
                <p className="sm:col-span-2 rounded-md border border-accent-500 bg-accent-50 px-3 py-2 text-xs text-accent-700">
                  Solde négatif : la prise en charge et les règlements dépassent le montant facturé.
                  Cette facture demande une vérification comptable.
                </p>
              )}
            </dl>

            {reglements.length > 0 && (
              <div className="border-t border-neutral-200 px-5 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Règlements</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {reglements.map((reglement) => (
                    <li key={reglement.id} className="text-sm text-neutral-600">
                      <span className="tabular-nums text-secondary-500">{montant(reglement.amount)}</span>
                      {" — "}
                      {paymentMethodLabel(reglement.paymentMethod)}
                      {", "}
                      {formatDateTime(reglement.paymentDate)}
                      {reglement.referenceNumber && ` · réf. ${reglement.referenceNumber}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-neutral-500">{libelle}</dt>
      <dd className="text-sm tabular-nums text-secondary-500">{valeur}</dd>
    </div>
  );
}
