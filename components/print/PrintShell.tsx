"use client";

import type { ReactNode } from "react";

/**
 * Coquille A4 commune aux documents imprimables : facture, ordonnance, resultats d'examens.
 *
 * Reprend l'ossature des gabarits valides par le metier (projet Claude Design « Polyclinic ») :
 * en-tete a la colombe et coordonnees, bandeau titre + numero, corps, bloc signature, pied
 * legal, filigrane. Les couleurs sont celles du theme du site (tailwind.config.js) : sarcelle
 * #138F89, encre #2C2C2C, rouge du logo #C41E22 — et non celles du gabarit d'origine.
 *
 * L'impression passe par le navigateur (Ctrl+P ou le bouton), qui sait produire le PDF : pas de
 * generation cote serveur tant qu'aucun document n'exige de faire foi hors de l'etablissement.
 */

/** Couleurs du theme, en dur : un document imprime ne doit dependre d'aucune classe Tailwind. */
export const ENCRE = "#2C2C2C";
export const ROUGE = "#C41E22";
export const SARCELLE = "#138F89";
export const SARCELLE_SOMBRE = "#0D615D";
export const FILET = "#C8C8C8";
export const FILET_LEGER = "#E8E8E8";
export const GRIS = "#6E6E6E";
export const GRIS_DOUX = "#8A8A8A";

/**
 * Identite de l'etablissement, centralisee ici : c'est le seul endroit a corriger si une
 * coordonnee ou un identifiant legal change. Valeurs reprises des gabarits fournis par le
 * metier — a confirmer par lui avant toute remise officielle.
 */
export const ETABLISSEMENT = {
  nom: "Polyclinic Fultang",
  adresse: ["Nkongsamba — Département du Moungo, Cameroun", "B.P. 691 Nkongsamba"],
  telephone: "Tél. (+237) 658 700 779",
  email: "contact@polyclinicfultang.com",
  legal: [
    "Polyclinic Fultang — Nkongsamba, Moungo",
    "RCCM : CM-DLA-2011-B-4472 — NIU : M081100032748H",
    "Autorisation MINSANTE n° 0117/A/MSP/SG",
  ],
};

/** Micro-etiquette en capitales espacees, la signature typographique des gabarits. */
export function Etiquette({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: "9.5px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: GRIS,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

/** Une case de la grille d'identification (patient, date, prescripteur...). */
export function CaseIdentite({
  etiquette,
  principal,
  secondaire,
  premiere = false,
}: {
  etiquette: string;
  principal: ReactNode;
  secondaire?: ReactNode;
  premiere?: boolean;
}) {
  return (
    <div
      style={{
        padding: premiere ? "10px 12px 10px 0" : "10px 12px",
        borderLeft: premiere ? "none" : `1px solid ${FILET_LEGER}`,
      }}
    >
      <Etiquette>{etiquette}</Etiquette>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{principal}</div>
      {secondaire && (
        <div style={{ fontSize: "10.5px", color: GRIS, marginTop: 2 }}>{secondaire}</div>
      )}
    </div>
  );
}

/** La grille d'identification sous le bandeau titre. */
export function GrilleIdentite({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: `2px solid ${FILET_LEGER}`,
        borderBottom: `2px solid ${FILET_LEGER}`,
      }}
    >
      {children}
    </div>
  );
}

export default function PrintShell({
  titre,
  numero,
  tag,
  tonTag = "sarcelle",
  sousTitre,
  note,
  signature,
  children,
}: {
  titre: string;
  numero: string;
  /** Pastille a cote du titre : « Acquittée », « Hors normes »... Rien si absente. */
  tag?: string;
  tonTag?: "sarcelle" | "rouge" | "contour";
  /** La ligne sous le nom de l'etablissement : « Soins — Laboratoire — Imagerie ». */
  sousTitre: string;
  /** Mention en bas a gauche, face au bloc signature. */
  note?: string;
  /** Libelle du bloc signature. Absent, pas de bloc. */
  signature?: string;
  children: ReactNode;
}) {
  const fondTag =
    tonTag === "rouge"
      ? { background: ROUGE, color: "#ffffff", border: "none" }
      : tonTag === "contour"
        ? { background: "transparent", color: ENCRE, border: `1px solid ${ENCRE}` }
        : { background: SARCELLE, color: "#ffffff", border: "none" };

  return (
    <div style={{ background: "#e9e9e9", minHeight: "100vh", padding: "24px 0" }} className="feuille-hote">
      {/* Regles d'impression : la feuille devient la page, tout le decor d'ecran disparait. */}
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .feuille-hote { background: #ffffff !important; padding: 0 !important; }
          .feuille { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={() => window.print()}
        className="no-print"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 10,
          background: SARCELLE,
          color: "#ffffff",
          border: "none",
          borderRadius: 6,
          padding: "10px 18px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--police-corps), Montserrat, sans-serif",
        }}
      >
        Imprimer / PDF
      </button>

      <section
        className="feuille"
        style={{
          position: "relative",
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          background: "#ffffff",
          color: ENCRE,
          fontFamily: "var(--police-corps), Montserrat, sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: "13mm 14mm",
          overflow: "hidden",
          boxShadow: "0 2px 18px rgba(0,0,0,0.18)",
        }}
      >
        {/* La colombe en filigrane, au centre de la page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/background_dashboard.svg"
          alt=""
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "118mm",
            transform: "translate(-50%, -50%)",
            opacity: 0.05,
            pointerEvents: "none",
          }}
        />

        {/* En-tete : logo, nom, coordonnees. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            paddingBottom: 14,
            borderBottom: `2px solid ${ENCRE}`,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_polyclinic.png"
              alt="Logo Polyclinic Fultang"
              style={{ width: 48, height: "auto", flex: "none" }}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--police-titres), Georgia, serif",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                {ETABLISSEMENT.nom}
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: SARCELLE_SOMBRE,
                  marginTop: 4,
                }}
              >
                {sousTitre}
              </div>
            </div>
          </div>
          <div style={{ fontSize: "10.5px", lineHeight: 1.65, textAlign: "right", color: GRIS }}>
            {ETABLISSEMENT.adresse.map((ligne) => (
              <div key={ligne}>{ligne}</div>
            ))}
            <div>{ETABLISSEMENT.telephone}</div>
            <div>{ETABLISSEMENT.email}</div>
          </div>
        </div>

        {/* Bandeau titre + numero. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 24,
            padding: "30px 0 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div
              style={{
                fontFamily: "var(--police-titres), Georgia, serif",
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              {titre}
            </div>
            {tag && (
              <span
                style={{
                  ...fondTag,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: 3,
                }}
              >
                {tag}
              </span>
            )}
          </div>
          <div style={{ fontFamily: "var(--police-titres), Georgia, serif", fontWeight: 700, fontSize: 15 }}>
            {numero}
          </div>
        </div>

        {children}

        <div style={{ flex: 1 }} />

        {/* Note + signature. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 32,
            paddingTop: 14,
          }}
        >
          <div style={{ fontSize: "10.5px", lineHeight: 1.6, color: GRIS, maxWidth: "92mm" }}>
            {note}
          </div>
          {signature && (
            <div style={{ width: "62mm", flex: "none" }}>
              <div style={{ height: "22mm", borderBottom: `1px solid ${GRIS_DOUX}` }} />
              <div
                style={{
                  fontSize: "9.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: GRIS,
                  marginTop: 5,
                }}
              >
                {signature}
              </div>
            </div>
          )}
        </div>

        {/* Pied legal. */}
        <div
          style={{
            position: "relative",
            marginTop: 12,
            paddingTop: 8,
            borderTop: `2px solid ${ENCRE}`,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            letterSpacing: "0.06em",
            color: GRIS_DOUX,
          }}
        >
          {ETABLISSEMENT.legal.map((mention) => (
            <span key={mention}>{mention}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
