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
  fetchPrescriptionsByPatient,
  formatDateTime,
  type PrescriptionView,
} from "@/lib/medicalRecords";
import { fetchDoctorProfile, fetchPatientProfile, type DoctorProfile, type PatientProfile } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Ordonnance imprimable, remise au patient apres la consultation.
 *
 * Le chemin porte le patient ET l'ordonnance : le backend n'expose pas d'ordonnance par son
 * seul numero, et c'est la route par patient qui verifie les droits — un patient n'imprime que
 * les siennes. Les fiches (patient, prescripteur) sont enrichies au mieux, sans bloquer.
 */
export default function Page() {
  const params = useParams<{ patientId: string; prescriptionId: string }>();
  const patientId = Number(params.patientId);
  const prescriptionId = Number(params.prescriptionId);

  const etat = useAuthenticatedResource<{
    ordonnance: PrescriptionView;
    patient: PatientProfile | null;
    medecin: DoctorProfile | null;
  } | null>(
    async (session) => {
      const ordonnances = await fetchPrescriptionsByPatient(patientId, session.token);
      const ordonnance = ordonnances.find((o) => o.id === prescriptionId);
      if (!ordonnance) {
        return null; // bascule en « impossible » : introuvable chez ce patient.
      }
      let patient: PatientProfile | null = null;
      let medecin: DoctorProfile | null = null;
      try {
        patient = await fetchPatientProfile(patientId, session.token);
      } catch {
        // La fiche manque : l'ordonnance s'imprime avec le seul numero de fiche.
      }
      if (ordonnance.doctorId !== null) {
        try {
          medecin = await fetchDoctorProfile(ordonnance.doctorId, session.token);
        } catch {
          // Idem : le cachet dira le nom.
        }
      }
      return { ordonnance, patient, medecin };
    },
    [patientId, prescriptionId]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement de l'ordonnance…" />;
  }
  if (etat.phase === "erreur" || etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Ordonnance indisponible"
        description={etat.phase === "erreur" ? etat.message : "Cette ordonnance n'existe pas pour ce patient."}
      />
    );
  }

  const donnees = etat.donnees;
  if (donnees === null) {
    // La liste du patient a repondu, mais sans cette ordonnance : identifiant errone ou
    // ordonnance d'un autre patient.
    return (
      <SectionMessage
        variant="error"
        title="Ordonnance indisponible"
        description="Cette ordonnance n'existe pas pour ce patient."
      />
    );
  }
  const { ordonnance, patient, medecin } = donnees;
  const lignes = ordonnance.items ?? [];

  return (
    <PrintShell
      titre="Ordonnance"
      numero={`N° ORD-${String(ordonnance.id).padStart(5, "0")}`}
      sousTitre="Consultations — Médecine générale"
      note="Ordonnance valable trois mois. Non renouvelable sans avis médical. Toute substitution relève du pharmacien dispensateur."
      signature="Cachet et signature du médecin"
    >
      <GrilleIdentite>
        <CaseIdentite
          premiere
          etiquette="Patient"
          principal={patient?.name ?? "—"}
          secondaire={`Fiche n° ${patientId}`}
        />
        <CaseIdentite
          etiquette="Date"
          principal={formatDateTime(ordonnance.issueDate)}
          secondaire={
            ordonnance.consultationDate
              ? `Consultation du ${formatDateTime(ordonnance.consultationDate, false)}`
              : undefined
          }
        />
        <CaseIdentite
          etiquette="Prescripteur"
          principal={medecin?.name ?? "—"}
          secondaire={medecin?.specialization ?? undefined}
        />
      </GrilleIdentite>

      {ordonnance.diagnosis && (
        <div
          style={{
            position: "relative",
            marginTop: 18,
            padding: "11px 14px",
            background: "#F6F6F6",
            borderLeft: `2px solid ${SARCELLE}`,
          }}
        >
          <Etiquette>Diagnostic retenu</Etiquette>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>{ordonnance.diagnosis}</div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          fontFamily: "var(--police-titres), Georgia, serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 24,
          paddingBottom: 8,
          borderBottom: `2px solid ${ENCRE}`,
        }}
      >
        Traitement prescrit
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
        {lignes.map((ligne, index) => (
          <div
            key={ligne.id}
            style={{
              display: "flex",
              gap: 14,
              padding: "13px 0",
              borderBottom: `1px solid ${FILET_LEGER}`,
            }}
          >
            <div
              style={{
                fontFamily: "var(--police-titres), Georgia, serif",
                fontWeight: 700,
                fontSize: 15,
                color: ROUGE,
                width: 22,
                flex: "none",
              }}
            >
              {index + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {ligne.medicineName ?? "Médicament non nommé"}
              </div>
              <div style={{ fontSize: "11.5px", lineHeight: 1.6, color: GRIS, marginTop: 3 }}>
                {ligne.dosage ?? "Posologie non précisée"}
                {ligne.duration ? ` — ${ligne.duration}` : ""}
              </div>
            </div>
          </div>
        ))}
        {lignes.length === 0 && (
          <div style={{ padding: "13px 0", fontSize: "11.5px", color: GRIS }}>
            Aucune ligne de prescription.
          </div>
        )}
      </div>
    </PrintShell>
  );
}
