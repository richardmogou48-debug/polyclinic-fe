"use client";

import {
  ENCRE_CV,
  EcranCv,
  EtiquetteCv,
  FeuilleCv,
  FILET_CV,
  GRIS_CV,
  GRIS_PIED,
  GRIS_TXT,
  PucesCv,
  ROUGE_CV,
  ROUGE_VIF,
  TitreDate,
  useMonCv,
} from "@/components/print/cv/CvCommun";
import { lignes } from "@/lib/cv";

/**
 * CV au format canadien, calque sur le gabarit valide : format Lettre, deux pages, PAS de photo
 * ni d'etat civil — l'usage canadien les proscrit, et le pied de page 2 le dit explicitement.
 * Le complement d'experience (heures/semaine, code CNP) n'apparait que sur ce gabarit.
 */
const SECTION: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "112px 1fr",
  gap: 26,
  padding: "15px 0",
  borderBottom: `1px solid ${FILET_CV}`,
};

const PAGE: React.CSSProperties = { padding: "50px 58px 34px" };

export default function Page() {
  const etat = useMonCv();

  if (etat.phase !== "pret") {
    return <EcranCv phase="chargement" />;
  }
  const cv = etat.donnees;
  if (cv === null) {
    return <EcranCv phase="absent" />;
  }

  const competences = lignes(cv.competences);
  const pied = (page: number) => (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 16,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: GRIS_PIED,
      }}
    >
      <span>{cv.nom}</span>
      <span>Page {page} sur 2</span>
    </div>
  );

  return (
    <FeuilleCv format="letter">
      <section key="p1" className="feuille-cv" style={PAGE}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 32,
            alignItems: "end",
            paddingBottom: 14,
            borderBottom: `2px solid ${ENCRE_CV}`,
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: ROUGE_CV, marginBottom: 9 }}>
              Curriculum vitæ — format canadien
            </div>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.015em" }}>{cv.nom}</h1>
            <div style={{ marginTop: 9, fontSize: 14.5, fontWeight: 600 }}>{cv.titre}</div>
          </div>
          <div style={{ display: "grid", gap: 3, fontSize: 11.5, lineHeight: 1.4, color: GRIS_TXT }}>
            {cv.localisation && <div>{cv.localisation}</div>}
            {cv.telephone && <div>{cv.telephone}</div>}
            {cv.email && <div>{cv.email}</div>}
            {cv.lienWeb && <div>{cv.lienWeb}</div>}
            {cv.mentionMobilite && <div style={{ color: GRIS_CV }}>{cv.mentionMobilite}</div>}
          </div>
        </div>

        {cv.profil && (
          <div style={SECTION}>
            <EtiquetteCv>Profil</EtiquetteCv>
            <div style={{ fontSize: 12.8, lineHeight: 1.55, textWrap: "pretty" }}>{cv.profil}</div>
          </div>
        )}

        {competences.length > 0 && (
          <div style={SECTION}>
            <EtiquetteCv>Compétences</EtiquetteCv>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 26px", fontSize: 12.4, lineHeight: 1.4 }}>
              {competences.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...SECTION, borderBottom: "none", paddingBottom: 0 }}>
          <EtiquetteCv>Expérience</EtiquetteCv>
          <div style={{ display: "grid", gap: 17 }}>
            {cv.experiences.map((exp, i) => (
              <div key={i} style={{ display: "grid", gap: 4 }}>
                <TitreDate titre={exp.poste} date={exp.periode} />
                <div style={{ fontSize: 12.2, color: GRIS_TXT }}>
                  {exp.employeur}
                  {exp.lieu ? ` — ${exp.lieu}` : ""}
                  {exp.complement ? ` · ${exp.complement}` : ""}
                </div>
                <PucesCv texte={exp.realisations} />
              </div>
            ))}
          </div>
        </div>

        {pied(1)}
      </section>

      <section key="p2" className="feuille-cv" style={PAGE}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 12, borderBottom: `2px solid ${ENCRE_CV}` }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{cv.nom}</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: GRIS_CV }}>
            Curriculum vitæ — suite
          </div>
        </div>

        {cv.formations.some((f) => f.diplome) && (
          <div style={SECTION}>
            <EtiquetteCv>Formation</EtiquetteCv>
            <div style={{ display: "grid", gap: 12 }}>
              {cv.formations.map((formation, i) => (
                <div key={i} style={{ display: "grid", gap: 3 }}>
                  <TitreDate titre={formation.diplome} date={formation.annee} />
                  <div style={{ fontSize: 12.2, color: GRIS_TXT }}>{formation.etablissement}</div>
                  {formation.complement && <div style={{ fontSize: 12.2, color: GRIS_TXT }}>{formation.complement}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {lignes(cv.certifications).length > 0 && (
          <div style={SECTION}>
            <EtiquetteCv>Permis et certifications</EtiquetteCv>
            <div style={{ display: "grid", gap: 5, fontSize: 12.4, lineHeight: 1.45 }}>
              {lignes(cv.certifications).map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
          </div>
        )}

        {cv.langues.some((l) => l.langue) && (
          <div style={SECTION}>
            <EtiquetteCv>Langues</EtiquetteCv>
            <div style={{ display: "grid", gap: 7, fontSize: 12.4, lineHeight: 1.45 }}>
              {cv.langues.map((langue, i) => (
                <div key={i}>
                  <span style={{ fontWeight: 800 }}>{langue.langue}</span>
                  {langue.niveau ? ` — ${langue.niveau}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {cv.benevolatTitre && (
          <div style={SECTION}>
            <EtiquetteCv>Bénévolat</EtiquetteCv>
            <div style={{ display: "grid", gap: 4 }}>
              <TitreDate titre={cv.benevolatTitre} date={cv.benevolatPeriode} />
              <div style={{ fontSize: 12.4, lineHeight: 1.48 }}>{cv.benevolatDescription}</div>
            </div>
          </div>
        )}

        <div style={SECTION}>
          <EtiquetteCv>Références</EtiquetteCv>
          <div style={{ fontSize: 12.4, lineHeight: 1.5 }}>
            Disponibles sur demande. Les lettres d&apos;emploi détaillant le titre du poste, les dates, les
            heures travaillées et les tâches principales sont fournies séparément, conformément aux
            exigences d&apos;IRCC.
          </div>
        </div>

        <div style={{ marginTop: 22, borderLeft: `2px solid ${ROUGE_VIF}`, padding: "2px 0 2px 14px", fontSize: 11.5, lineHeight: 1.5, color: GRIS_TXT, maxWidth: "78%" }}>
          Conformément à l&apos;usage canadien, ce curriculum vitæ ne comporte ni photographie, ni date de
          naissance, ni état civil, ni mention de la nationalité au-delà de ce qui touche à
          l&apos;admissibilité au travail.
        </div>

        {pied(2)}
      </section>
    </FeuilleCv>
  );
}
