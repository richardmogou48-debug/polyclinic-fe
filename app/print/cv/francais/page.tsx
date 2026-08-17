"use client";

import {
  ENCRE_CV,
  EcranCv,
  FeuilleCv,
  FILET_CV,
  GRIS_CV,
  GRIS_PIED,
  GRIS_TXT,
  PucesCv,
  ROUGE_CV,
  TitreDate,
  useMonCv,
} from "@/components/print/cv/CvCommun";
import { lignes } from "@/lib/cv";

/**
 * CV au format francais, calque sur le gabarit valide : A4 une page, photo et etat civil en
 * en-tete — l'usage francais les admet, seuls les champs renseignes s'affichent —, corps en deux
 * colonnes (experiences et formation a gauche, competences, certifications, langues et centres
 * d'interet en marge droite).
 */
const TITRE_SECTION: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: GRIS_CV,
  paddingBottom: 7,
  borderBottom: `2px solid ${ENCRE_CV}`,
};

export default function Page() {
  const etat = useMonCv();

  if (etat.phase !== "pret") {
    return <EcranCv phase="chargement" />;
  }
  const cv = etat.donnees;
  if (cv === null) {
    return <EcranCv phase="absent" />;
  }

  const etatCivil = [
    [cv.age, cv.etatCivil].filter(Boolean).join(" · "),
    cv.telephone,
    cv.nationalite,
    cv.email,
    cv.permisConduire,
    cv.localisation,
  ].filter(Boolean);

  return (
    <FeuilleCv format="a4">
      <section className="feuille-cv" style={{ padding: "50px 48px 34px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cv.photo ? "1fr 104px" : "1fr",
            gap: 26,
            alignItems: "start",
            paddingBottom: 13,
            borderBottom: `2px solid ${ENCRE_CV}`,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.015em" }}>{cv.nom}</h1>
            <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: ROUGE_CV, textTransform: "uppercase" }}>{cv.titre}</div>
            <div style={{ marginTop: 11, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 22px", fontSize: 11.5, lineHeight: 1.45, color: GRIS_TXT }}>
              {etatCivil.map((info) => (
                <div key={info}>{info}</div>
              ))}
            </div>
          </div>
          {cv.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cv.photo}
              alt={`Photo de ${cv.nom}`}
              style={{ width: 104, height: 130, objectFit: "cover", filter: "grayscale(1)" }}
            />
          )}
        </div>

        {cv.profil && (
          <div style={{ padding: "13px 0", borderBottom: `1px solid ${FILET_CV}`, fontSize: 13, lineHeight: 1.5, textWrap: "pretty" }}>
            {cv.profil}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 208px", gap: 32, paddingTop: 15, flex: 1 }}>
          <div style={{ display: "grid", gap: 26, alignContent: "start" }}>
            <div style={TITRE_SECTION}>Expériences professionnelles</div>
            {cv.experiences.map((exp, i) => (
              <div key={i} style={{ display: "grid", gap: 3 }}>
                <TitreDate titre={exp.poste} date={exp.periode} taille={15.5} />
                <div style={{ fontSize: 13, color: GRIS_TXT }}>
                  {exp.employeur}
                  {exp.lieu ? ` — ${exp.lieu}` : ""}
                </div>
                <PucesCv texte={exp.realisations} taille={13.5} />
              </div>
            ))}

            {cv.formations.some((f) => f.diplome) && (
              <>
                <div style={{ ...TITRE_SECTION, marginTop: 4 }}>Formation</div>
                <div style={{ display: "grid", gap: 9 }}>
                  {cv.formations.map((formation, i) => (
                    <div key={i} style={{ display: "grid", gap: 2 }}>
                      <TitreDate titre={formation.diplome} date={formation.annee} taille={15.5} />
                      <div style={{ fontSize: 13, color: GRIS_TXT }}>
                        {formation.etablissement}
                        {formation.complement ? ` — ${formation.complement}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ display: "grid", gap: 24, alignContent: "start", borderLeft: `1px solid ${FILET_CV}`, paddingLeft: 26 }}>
            {lignes(cv.competences).length > 0 && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={TITRE_SECTION}>Compétences</div>
                <div style={{ display: "grid", gap: 3, fontSize: 13, lineHeight: 1.42 }}>
                  {lignes(cv.competences).map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
              </div>
            )}

            {lignes(cv.certifications).length > 0 && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={TITRE_SECTION}>Formations complémentaires</div>
                <div style={{ display: "grid", gap: 3, fontSize: 13, lineHeight: 1.42 }}>
                  {lignes(cv.certifications).map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
              </div>
            )}

            {cv.langues.some((l) => l.langue) && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={TITRE_SECTION}>Langues</div>
                <div style={{ display: "grid", gap: 3, fontSize: 13, lineHeight: 1.42 }}>
                  {cv.langues.map((langue, i) => (
                    <div key={i}>
                      <span style={{ fontWeight: 800 }}>{langue.langue}</span>
                      {langue.niveau ? ` — ${langue.niveau}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lignes(cv.interets).length > 0 && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={TITRE_SECTION}>Centres d&apos;intérêt</div>
                <div style={{ display: "grid", gap: 3, fontSize: 13, lineHeight: 1.42 }}>
                  {lignes(cv.interets).map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 14, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: GRIS_PIED }}>
          Références disponibles sur demande
        </div>
      </section>
    </FeuilleCv>
  );
}
