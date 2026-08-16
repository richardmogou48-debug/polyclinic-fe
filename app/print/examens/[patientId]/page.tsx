"use client";

import { useParams } from "next/navigation";
import SectionMessage from "@/components/dashboard/SectionMessage";
import PrintShell, {
  CaseIdentite,
  ENCRE,
  FILET_LEGER,
  GRIS,
  GrilleIdentite,
  ROUGE,
} from "@/components/print/PrintShell";
import {
  examCategoryLabel,
  fetchExamsByPatient,
  formatDateTime,
  type ExamRequestView,
} from "@/lib/medicalRecords";
import { fetchPatientProfile, type PatientProfile } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Bulletin de resultats d'examens : tous les examens du patient qui ont rendu.
 *
 * Les resultats sont du texte consigne par le plateau — mesures et conclusion — et non des
 * analytes structures avec valeurs de reference : le bulletin restitue ce que le dossier porte,
 * il n'invente pas de tableau de normes. « Hors normes » est le marqueur pose par le soignant.
 */
export default function Page() {
  const params = useParams<{ patientId: string }>();
  const patientId = Number(params.patientId);

  const etat = useAuthenticatedResource<{ examens: ExamRequestView[]; patient: PatientProfile | null }>(
    async (session) => {
      const tous = await fetchExamsByPatient(patientId, session.token);
      let patient: PatientProfile | null = null;
      try {
        patient = await fetchPatientProfile(patientId, session.token);
      } catch {
        // La fiche manque : le bulletin s'imprime avec le seul numero de fiche.
      }
      return { examens: tous.filter((examen) => examen.result !== null), patient };
    },
    [patientId]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement des résultats…" />;
  }
  if (etat.phase === "erreur" || etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Résultats indisponibles"
        description={etat.phase === "erreur" ? etat.message : undefined}
      />
    );
  }

  const { examens, patient } = etat.donnees;
  const horsNormes = examens.filter((examen) => examen.result?.abnormal).length;

  if (examens.length === 0) {
    return (
      <SectionMessage
        variant="empty"
        title="Aucun résultat rendu"
        description="Aucun examen de ce patient n'a encore rendu de résultat."
      />
    );
  }

  return (
    <PrintShell
      titre="Résultats d'examens"
      numero={`Fiche n° ${patientId}`}
      tag={horsNormes > 0 ? `${horsNormes} hors normes` : undefined}
      tonTag="rouge"
      sousTitre="Laboratoire — Imagerie — Explorations"
      note="Ces résultats sont à interpréter par le médecin prescripteur. Les comptes rendus détaillés et clichés restent consultables au dossier."
      signature="Cachet et signature — plateau technique"
    >
      <GrilleIdentite>
        <CaseIdentite
          premiere
          etiquette="Patient"
          principal={patient?.name ?? "—"}
          secondaire={`Fiche n° ${patientId}`}
        />
        <CaseIdentite etiquette="Édité le" principal={formatDateTime(new Date().toISOString())} />
        <CaseIdentite
          etiquette="Examens rendus"
          principal={String(examens.length)}
          secondaire={horsNormes > 0 ? `dont ${horsNormes} hors normes` : "Tous dans les normes déclarées"}
        />
      </GrilleIdentite>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", marginTop: 6 }}>
        {examens.map((examen) => (
          <div key={examen.id} style={{ padding: "14px 0", borderBottom: `1px solid ${FILET_LEGER}` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: ENCRE }}>
                {examen.label ?? `Examen ${examen.id}`}
              </span>
              <span style={{ fontSize: "10.5px", color: GRIS }}>
                {examCategoryLabel(examen.category)} — demandé le {formatDateTime(examen.requestedAt, false)}
                {examen.result?.performedAt
                  ? ` — rendu le ${formatDateTime(examen.result.performedAt, false)}`
                  : ""}
              </span>
              {examen.result?.abnormal && (
                <span
                  style={{
                    background: ROUGE,
                    color: "#ffffff",
                    fontSize: 9.5,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 3,
                  }}
                >
                  Hors normes
                </span>
              )}
            </div>
            {examen.result?.findings && (
              <div style={{ fontSize: "11.5px", lineHeight: 1.6, color: GRIS, marginTop: 5, whiteSpace: "pre-wrap" }}>
                {examen.result.findings}
              </div>
            )}
            {examen.result?.conclusion && (
              <div style={{ fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>
                <span style={{ fontWeight: 600 }}>Conclusion : </span>
                {examen.result.conclusion}
              </div>
            )}
          </div>
        ))}
      </div>
    </PrintShell>
  );
}
