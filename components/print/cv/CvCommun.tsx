"use client";

import { useEffect, useState, type ReactNode } from "react";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { chargerCvServeur, lireCvLocal, type CvData } from "@/lib/cv";
import { lignes } from "@/lib/cv";

/**
 * Socle commun des trois rendus de CV, calques sur les gabarits valides (projet Claude Design) :
 * meme encre, meme rouge, memes filets — la police Archivo est chargee par app/print/cv/layout.
 *
 * Ces documents sont PERSONNELS : pas d'en-tete ni de filigrane de la polyclinique, le CV
 * appartient a l'utilisateur, pas a l'etablissement.
 */
export const ENCRE_CV = "#201e1d";
export const ROUGE_CV = "#ae1800";
export const ROUGE_VIF = "#ec3013";
export const GRIS_CV = "#605d5d";
export const GRIS_TXT = "#444141";
export const GRIS_PIED = "#7d7979";
export const FILET_CV = "#d7d3d3";

type EtatCv =
  | { phase: "chargement" }
  | { phase: "pret"; donnees: CvData | null };

/**
 * Le CV a rendre : celui que designe le code de reprise garde par ce navigateur, sinon le
 * brouillon local. Aucune authentification — le generateur de CV est un service public, sans
 * lien avec les comptes de l'application.
 */
export function useMonCv(): EtatCv {
  const [etat, setEtat] = useState<EtatCv>({ phase: "chargement" });

  useEffect(() => {
    let actif = true;
    chargerCvServeur()
      .then((donnees) => {
        if (actif) setEtat({ phase: "pret", donnees: donnees ?? lireCvLocal() });
      })
      .catch(() => {
        // CvMS muet : le brouillon local du navigateur, s'il existe, vaut mieux qu'une erreur.
        if (actif) setEtat({ phase: "pret", donnees: lireCvLocal() });
      });
    return () => {
      actif = false;
    };
  }, []);

  return etat;
}

export function EcranCv({ phase }: { phase: "chargement" | "absent" }) {
  if (phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement du CV…" />;
  }
  return (
    <SectionMessage
      variant="empty"
      title="Aucun CV enregistré"
      description="Renseignez d'abord vos informations dans l'éditeur de CV (/cv), puis revenez imprimer."
    />
  );
}

/**
 * La feuille : Letter pour le gabarit canadien, A4 pour les autres. Le bouton d'impression et le
 * decor d'ecran disparaissent a l'impression, ou la feuille devient la page.
 */
export function FeuilleCv({
  format,
  children,
}: {
  format: "a4" | "letter";
  children: ReactNode;
}) {
  const largeur = format === "letter" ? "216mm" : "210mm";
  const hauteur = format === "letter" ? "279mm" : "297mm";
  return (
    <div style={{ background: "#e9e9e9", minHeight: "100vh", padding: "24px 0" }} className="feuille-hote">
      <style>{`
        @page { size: ${format === "letter" ? "letter" : "A4"}; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .feuille-hote { background: #ffffff !important; padding: 0 !important; }
          .feuille-cv { box-shadow: none !important; margin: 0 !important; }
        }
        .feuille-cv ul { list-style: none; }
        .feuille-cv li { position: relative; }
        .feuille-cv li::before { content: "—"; color: ${ROUGE_CV}; position: absolute; margin-left: -15px; }
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
          background: ROUGE_CV,
          color: "#ffffff",
          border: "none",
          borderRadius: 6,
          padding: "10px 18px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--police-cv), Archivo, system-ui, sans-serif",
        }}
      >
        Imprimer / PDF
      </button>
      <div style={{ display: "grid", gap: 24, justifyContent: "center" }}>
        {Array.isArray(children) ? children : [children]}
      </div>
      <style>{`
        .feuille-cv {
          box-sizing: border-box;
          width: ${largeur};
          min-height: ${hauteur};
          background: #ffffff;
          color: ${ENCRE_CV};
          font-family: var(--police-cv), Archivo, system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 18px rgba(0,0,0,0.18);
          break-after: page;
        }
      `}</style>
    </div>
  );
}

/** L'etiquette de section des gabarits : capitales espacees, gris moyen. */
export function EtiquetteCv({ children, soulignee = false }: { children: ReactNode; soulignee?: boolean }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: GRIS_CV,
        paddingTop: soulignee ? 0 : 3,
        paddingBottom: soulignee ? 7 : 0,
        borderBottom: soulignee ? `2px solid ${ENCRE_CV}` : "none",
      }}
    >
      {children}
    </div>
  );
}

/** Liste a puces tiret des gabarits, depuis un champ « une ligne par element ». */
export function PucesCv({ texte, taille = 12.4 }: { texte: string; taille?: number }) {
  const elements = lignes(texte);
  if (elements.length === 0) {
    return null;
  }
  return (
    <ul style={{ margin: "3px 0 0", padding: "0 0 0 15px", fontSize: taille, lineHeight: 1.48, display: "grid", gap: 3 }}>
      {elements.map((element) => (
        <li key={element}>{element}</li>
      ))}
    </ul>
  );
}

/** Ligne titre + periode alignee a droite, commune aux experiences et formations. */
export function TitreDate({ titre, date, taille = 14 }: { titre: string; date: string; taille?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "baseline" }}>
      <div style={{ fontSize: taille, fontWeight: 800 }}>{titre}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: GRIS_CV, whiteSpace: "nowrap" }}>{date}</div>
    </div>
  );
}
