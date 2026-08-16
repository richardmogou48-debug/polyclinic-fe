"use client";

import { useParams } from "next/navigation";
import SectionMessage from "@/components/dashboard/SectionMessage";
import PrintShell, {
  CaseIdentite,
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
  montantEnLettres,
  paymentMethodLabel,
  type Invoice,
  type Payment,
} from "@/lib/billing";
import { formatDateTime } from "@/lib/medicalRecords";
import { fetchPatientProfile, type PatientProfile } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Recu de caisse : atteste d'UN reglement encaisse, la ou la facture recapitule le tout.
 *
 * C'est le document remis au comptoir apres chaque encaissement — souvent le seul papier que le
 * patient emporte. Le montant y figure en chiffres et en toutes lettres, comme l'exige l'usage
 * de caisse : un chiffre se surcharge, une somme ecrite ne se maquille pas.
 *
 * Meme regle d'acces que la facture : le personnel lit par numero, le patient retrouve la
 * sienne parmi ses factures via la route verifiee — l'appartenance est garantie par le backend.
 */
export default function Page() {
  const params = useParams<{ invoiceId: string; paymentId: string }>();
  const invoiceId = Number(params.invoiceId);
  const paymentId = Number(params.paymentId);

  const etat = useAuthenticatedResource<{
    facture: Invoice;
    reglement: Payment;
    patient: PatientProfile | null;
  } | null>(
    async (session) => {
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
      const reglement = facture?.payments?.find((p) => p.id === paymentId);
      if (!facture || !reglement) {
        return null;
      }
      let patient: PatientProfile | null = null;
      if (facture.patientId !== null) {
        try {
          patient = await fetchPatientProfile(facture.patientId, session.token);
        } catch {
          // Fiche introuvable ou ProfileMS muet : le recu s'imprime quand meme.
        }
      }
      return { facture, reglement, patient };
    },
    [invoiceId, paymentId]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du reçu…" />;
  }
  if (etat.phase === "erreur" || etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Reçu indisponible"
        description={etat.phase === "erreur" ? etat.message : undefined}
      />
    );
  }

  const donnees = etat.donnees;
  if (donnees === null) {
    return (
      <SectionMessage
        variant="error"
        title="Reçu indisponible"
        description="Ce règlement n'existe pas sur cette facture, ou la facture n'est pas la vôtre."
      />
    );
  }
  const { facture, reglement, patient } = donnees;
  const solde = facture.balanceDue ?? 0;

  return (
    <PrintShell
      titre="Reçu de caisse"
      numero={`N° REC-${String(reglement.id).padStart(5, "0")}`}
      tag={paymentMethodLabel(reglement.paymentMethod)}
      tonTag="sarcelle"
      sousTitre="Soins — Laboratoire — Imagerie"
      note="Ce reçu atteste du règlement ci-dessus. Il est à conserver et fait foi auprès de nos services."
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
          etiquette="Encaissement"
          principal={formatDateTime(reglement.paymentDate)}
          secondaire={reglement.cashierName ? `Caisse — ${reglement.cashierName}` : undefined}
        />
        <CaseIdentite
          etiquette="Facture"
          principal={`N° FAC-${String(facture.id).padStart(5, "0")}`}
          secondaire={invoiceStatusLabel(facture.status)}
        />
      </GrilleIdentite>

      {/* Le montant encaisse, en chiffres puis en toutes lettres. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "16px 14px",
          marginTop: 24,
          background: SARCELLE,
          color: "#ffffff",
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          Montant encaissé
        </span>
        <span style={{ fontFamily: "var(--police-titres), Georgia, serif", fontWeight: 700, fontSize: 26 }}>
          {montant(reglement.amount)}
        </span>
      </div>

      <div style={{ position: "relative", marginTop: 14, fontSize: 12, lineHeight: 1.6, fontStyle: "italic" }}>
        Arrêté le présent reçu à la somme de {montantEnLettres(reglement.amount ?? 0)}, reçue en
        règlement de la facture n° FAC-{String(facture.id).padStart(5, "0")}
        {reglement.referenceNumber ? ` (référence ${reglement.referenceNumber})` : ""}.
      </div>

      {/* Situation de la facture au moment de l'edition — pas apres ce seul reglement. */}
      <div style={{ position: "relative", marginTop: 24, maxWidth: "96mm" }}>
        <Etiquette>Situation de la facture à ce jour</Etiquette>
        <LigneRecap libelle="Total des actes" valeur={montant(facture.totalAmount)} />
        {(facture.insuranceCoverageAmount ?? 0) > 0 && (
          <LigneRecap libelle="Part assurance" valeur={`− ${montant(facture.insuranceCoverageAmount)}`} />
        )}
        {(facture.discountAmount ?? 0) > 0 && (
          <LigneRecap libelle="Remise" valeur={`− ${montant(facture.discountAmount)}`} />
        )}
        <LigneRecap libelle="Total réglé" valeur={montant(facture.paidAmount)} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0",
            fontSize: 12,
            fontWeight: 700,
            color: solde > 0 ? ROUGE : SARCELLE,
          }}
        >
          <span>{solde > 0 ? "Reste à payer" : "Facture soldée"}</span>
          <span>{solde > 0 ? montant(solde) : ""}</span>
        </div>
      </div>
    </PrintShell>
  );
}

function LigneRecap({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: "11.5px",
        borderBottom: `1px solid ${FILET_LEGER}`,
        color: GRIS,
      }}
    >
      <span>{libelle}</span>
      <span>{valeur}</span>
    </div>
  );
}
