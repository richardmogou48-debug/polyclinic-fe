"use client";

import { useParams } from "next/navigation";
import SectionMessage from "@/components/dashboard/SectionMessage";
import PrintShell, {
  CaseIdentite,
  ENCRE,
  Etiquette,
  FILET_LEGER,
  GRIS,
  GrilleIdentite,
  ROUGE,
  SARCELLE,
} from "@/components/print/PrintShell";
import {
  fetchInvoice,
  fetchInvoicesByPatient,
  invoiceStatusLabel,
  montant,
  paymentMethodLabel,
  type Invoice,
} from "@/lib/billing";
import { formatDateTime } from "@/lib/medicalRecords";
import { fetchPatientProfile, type PatientProfile } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Facture imprimable, remise au patient a la caisse.
 *
 * Les montants viennent tous du backend (Invoice.getBalanceDue) : rien n'est recalcule ici. La
 * fiche du patient est enrichie au mieux — son absence ne bloque pas l'impression, la facture
 * porte alors le seul numero de fiche.
 */
export default function Page() {
  const params = useParams<{ id: string }>();
  const invoiceId = Number(params.id);

  const etat = useAuthenticatedResource<{ facture: Invoice; patient: PatientProfile | null } | null>(
    async (session) => {
      // Le personnel lit la facture par son numero. Le patient n'y a pas droit — la route ne
      // porte pas d'identifiant de patient — mais il lit SES factures par la route verifiee :
      // on y retrouve la sienne, et l'appartenance est garantie par le backend, pas par l'ecran.
      let facture: Invoice | undefined;
      if (session.role === "patient") {
        if (!session.profileId) {
          return null;
        }
        const siennes = await fetchInvoicesByPatient(Number(session.profileId), session.token);
        facture = siennes.find((f) => f.id === invoiceId);
      } else {
        facture = await fetchInvoice(invoiceId, session.token);
      }
      if (!facture) {
        return null; // introuvable parmi les factures du patient connecte
      }
      let patient: PatientProfile | null = null;
      if (facture.patientId !== null) {
        try {
          patient = await fetchPatientProfile(facture.patientId, session.token);
        } catch {
          // Fiche introuvable ou ProfileMS muet : la facture s'imprime quand meme.
        }
      }
      return { facture, patient };
    },
    [invoiceId]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement de la facture…" />;
  }
  if (etat.phase === "erreur" || etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Facture indisponible"
        description={etat.phase === "erreur" ? etat.message : undefined}
      />
    );
  }

  const donnees = etat.donnees;
  if (donnees === null) {
    return (
      <SectionMessage
        variant="error"
        title="Facture indisponible"
        description="Cette facture n'existe pas parmi les vôtres."
      />
    );
  }
  const { facture, patient } = donnees;
  const postes = facture.items ?? [];
  const reglements = facture.payments ?? [];
  const solde = facture.balanceDue ?? 0;
  const acquittee = facture.status === "PAID";

  return (
    <PrintShell
      titre="Facture"
      numero={`N° FAC-${String(facture.id).padStart(5, "0")}`}
      tag={invoiceStatusLabel(facture.status)}
      tonTag={acquittee ? "sarcelle" : "contour"}
      sousTitre="Soins — Laboratoire — Imagerie"
      note="Merci de conserver ce document. Il fait foi de règlement auprès de nos services."
      signature="Cachet et signature — la caisse"
    >
      <GrilleIdentite>
        <CaseIdentite
          premiere
          etiquette="Patient"
          principal={patient?.name ?? "—"}
          secondaire={`Fiche n° ${facture.patientId ?? "—"}`}
        />
        <CaseIdentite
          etiquette="Émission"
          principal={formatDateTime(facture.issueDate)}
          secondaire={facture.dueDate ? `Échéance ${formatDateTime(facture.dueDate, false)}` : undefined}
        />
        <CaseIdentite
          etiquette="Prise en charge"
          principal={
            (facture.insuranceCoverageAmount ?? 0) > 0
              ? `Assurance — ${montant(facture.insuranceCoverageAmount)}`
              : "Aucune"
          }
        />
      </GrilleIdentite>

      <table style={{ position: "relative", width: "100%", marginTop: 18, fontSize: "11.5px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            {["Désignation", "Qté", "P.U. (FCFA)", "Montant"].map((entete, i) => (
              <th
                key={entete}
                style={{
                  padding: i === 0 ? "8px 10px 8px 0" : "8px 0 8px 10px",
                  fontSize: "9.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  borderBottom: `2px solid ${ENCRE}`,
                  textAlign: i === 0 ? "left" : "right",
                  width: i === 0 ? "100%" : undefined,
                  whiteSpace: "nowrap",
                }}
              >
                {entete}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {postes.map((poste) => (
            <tr key={poste.id}>
              <td style={{ padding: "8px 10px 8px 0", borderBottom: `1px solid ${FILET_LEGER}` }}>
                {poste.description ?? "—"}
              </td>
              <td style={{ padding: "8px 0 8px 10px", borderBottom: `1px solid ${FILET_LEGER}`, textAlign: "right" }}>
                {poste.quantity ?? "—"}
              </td>
              <td style={{ padding: "8px 0 8px 10px", borderBottom: `1px solid ${FILET_LEGER}`, textAlign: "right", whiteSpace: "nowrap" }}>
                {montant(poste.unitPrice)}
              </td>
              <td style={{ padding: "8px 0 8px 10px", borderBottom: `1px solid ${FILET_LEGER}`, textAlign: "right", whiteSpace: "nowrap" }}>
                {montant(poste.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 32, marginTop: 16 }}>
        <div style={{ flex: 1, fontSize: 11, lineHeight: 1.6, color: GRIS, maxWidth: "88mm" }}>
          <Etiquette>Règlements</Etiquette>
          {reglements.length === 0 ? (
            <div>Aucun règlement enregistré.</div>
          ) : (
            reglements.map((reglement) => (
              <div key={reglement.id}>
                {paymentMethodLabel(reglement.paymentMethod)} — {montant(reglement.amount)}
                {reglement.paymentDate ? ` — ${formatDateTime(reglement.paymentDate)}` : ""}
                {reglement.referenceNumber ? ` — réf. ${reglement.referenceNumber}` : ""}
              </div>
            ))
          )}
        </div>
        <div style={{ width: "74mm", flex: "none" }}>
          <LigneTotal libelle="Total des actes" valeur={montant(facture.totalAmount)} />
          {(facture.discountAmount ?? 0) > 0 && (
            <LigneTotal libelle="Remise" valeur={`− ${montant(facture.discountAmount)}`} />
          )}
          {(facture.insuranceCoverageAmount ?? 0) > 0 && (
            <LigneTotal libelle="Part assurance" valeur={`− ${montant(facture.insuranceCoverageAmount)}`} />
          )}
          {(facture.paidAmount ?? 0) > 0 && (
            <LigneTotal libelle="Déjà réglé" valeur={`− ${montant(facture.paidAmount)}`} />
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "9px 10px",
              marginTop: 8,
              background: solde > 0 ? ROUGE : SARCELLE,
              color: "#ffffff",
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {solde > 0 ? "Reste à payer" : "Facture acquittée"}
            </span>
            <span style={{ fontFamily: "var(--police-titres), Georgia, serif", fontWeight: 700, fontSize: 19 }}>
              {solde > 0 ? montant(solde) : montant(facture.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </PrintShell>
  );
}

function LigneTotal({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: "11.5px",
        borderBottom: `1px solid ${FILET_LEGER}`,
      }}
    >
      <span>{libelle}</span>
      <span>{valeur}</span>
    </div>
  );
}
