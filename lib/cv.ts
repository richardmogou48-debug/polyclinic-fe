// CV : appels vers CvMS et forme du document.
//
// CvMS est un service PUBLIC sans lien avec le reste de l'application : pas de compte, pas de
// jeton. A la premiere sauvegarde il remet un code opaque (UUID), seule cle du document — le
// navigateur le garde, et l'utilisateur peut le noter pour reprendre son CV ailleurs.
//
// CvMS stocke un document JSON opaque : c'est ICI que la forme d'un CV est definie, le backend
// n'en sait rien. Le meme jeu de donnees alimente les trois gabarits (canadien, francais,
// anglais) — chacun n'affiche que ce que son usage national admet : la photo et l'etat civil
// n'existent que pour la France, les codes CNP que pour le Canada.

import { API_URL, ApiError } from "@/lib/api";

export type CvExperience = {
  poste: string;
  employeur: string;
  lieu: string;
  /** Texte libre : « Mars 2021 – présent ». Les gabarits n'imposent pas de format de date. */
  periode: string;
  /** Precisions a la canadienne : « 40 h/semaine · CNP 31301 ». Affiche par le seul gabarit canadien. */
  complement: string;
  /** Une realisation par ligne. */
  realisations: string;
};

export type CvFormation = {
  diplome: string;
  etablissement: string;
  annee: string;
  /** Mention, equivalence WES... */
  complement: string;
};

export type CvLangue = {
  langue: string;
  /** Niveau europeen pour la France (C1), NCLC/IELTS pour le Canada : du texte libre. */
  niveau: string;
};

export type CvData = {
  nom: string;
  titre: string;
  localisation: string;
  telephone: string;
  email: string;
  lienWeb: string;
  /** Ligne de mobilite : « Admissible à un permis de travail — Entrée express ». */
  mentionMobilite: string;

  /** Etat civil : usages francais uniquement — les gabarits canadien et anglais l'ignorent. */
  age: string;
  etatCivil: string;
  nationalite: string;
  permisConduire: string;
  /** Photo en data URL, gabarit francais uniquement. */
  photo: string | null;

  profil: string;
  /** Une competence par ligne. */
  competences: string;
  /** Une certification par ligne. */
  certifications: string;
  /** Un centre d'interet par ligne (gabarit francais). */
  interets: string;

  experiences: CvExperience[];
  formations: CvFormation[];
  langues: CvLangue[];

  benevolatTitre: string;
  benevolatPeriode: string;
  benevolatDescription: string;
};

export const EXPERIENCE_VIDE: CvExperience = {
  poste: "",
  employeur: "",
  lieu: "",
  periode: "",
  complement: "",
  realisations: "",
};

export const FORMATION_VIDE: CvFormation = { diplome: "", etablissement: "", annee: "", complement: "" };

export const LANGUE_VIDE: CvLangue = { langue: "", niveau: "" };

export const CV_VIDE: CvData = {
  nom: "",
  titre: "",
  localisation: "",
  telephone: "",
  email: "",
  lienWeb: "",
  mentionMobilite: "",
  age: "",
  etatCivil: "",
  nationalite: "",
  permisConduire: "",
  photo: null,
  profil: "",
  competences: "",
  certifications: "",
  interets: "",
  experiences: [{ ...EXPERIENCE_VIDE }],
  formations: [{ ...FORMATION_VIDE }],
  langues: [{ ...LANGUE_VIDE }],
  benevolatTitre: "",
  benevolatPeriode: "",
  benevolatDescription: "",
};

/** Les lignes non vides d'un champ « un element par ligne ». */
export const lignes = (valeur: string): string[] =>
  valeur
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

type Enveloppe = { code: string; data: string; updatedAt: string };

const CLE_LOCALE = "polyclinic.cv";
const CLE_CODE = "polyclinic.cv.code";

/** Le code de reprise garde par ce navigateur, ou null si aucun CV n'a encore ete sauvegarde. */
export function lireCodeCv(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(CLE_CODE);
}

/**
 * Appel anonyme vers CvMS a travers la Gateway : la route /cv/** est publique, aucun jeton ne
 * part — c'est le code opaque, dans l'URL, qui tient lieu de cle.
 */
async function requeteCv(path: string, options?: RequestInit): Promise<Enveloppe> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new ApiError(
      `Impossible de contacter le serveur (${API_URL}). Verifiez que la Gateway est demarree.`
    );
  }
  if (!response.ok) {
    throw new ApiError(`Le serveur a repondu une erreur (HTTP ${response.status}).`, response.status);
  }
  // DELETE repond 204 sans corps : ne tenter le JSON que s'il y a quelque chose a lire.
  const brut = (await response.text()).trim();
  return (brut ? JSON.parse(brut) : null) as Enveloppe;
}

/**
 * Un document illisible (schema d'une version anterieure, corruption) est traite comme absent
 * plutot que de bloquer : l'editeur repart d'une page blanche, jamais d'une erreur.
 */
function analyser(brut: string): CvData | null {
  try {
    return { ...CV_VIDE, ...(JSON.parse(brut) as Partial<CvData>) };
  } catch {
    return null;
  }
}

/**
 * Le CV designe par le code de reprise garde dans CE navigateur, ou null s'il n'y en a pas.
 * Un code que le serveur ne reconnait plus est oublie : mieux vaut repartir d'une page blanche
 * que de re-echouer a chaque visite.
 */
export async function chargerCvServeur(): Promise<CvData | null> {
  const code = lireCodeCv();
  if (!code) {
    return null;
  }
  try {
    return analyser((await requeteCv(`/cv/${code}`)).data);
  } catch (cause) {
    if (cause instanceof ApiError && cause.statut === 404) {
      window.localStorage.removeItem(CLE_CODE);
      return null;
    }
    throw cause;
  }
}

/**
 * Le CV designe par un code saisi a la main (reprise depuis un autre appareil). S'il existe,
 * ce navigateur adopte le code : les sauvegardes suivantes iront sur ce document.
 */
export async function chargerCvParCode(code: string): Promise<CvData | null> {
  const enveloppe = await requeteCv(`/cv/${code.trim()}`);
  window.localStorage.setItem(CLE_CODE, enveloppe.code);
  return analyser(enveloppe.data);
}

/**
 * Sauvegarde sur CvMS, borne a 4 Mo cote serveur. Premiere fois : creation, et le code remis
 * est garde ici. Ensuite : mise a jour du meme document. Rend le code, pour l'afficher a
 * l'utilisateur — c'est son seul moyen de retrouver son CV depuis un autre appareil.
 */
export async function enregistrerCvServeur(cv: CvData): Promise<string> {
  const corps = JSON.stringify({ data: JSON.stringify(cv) });
  const entetes = { "Content-Type": "application/json" };
  const code = lireCodeCv();
  if (code) {
    try {
      return (await requeteCv(`/cv/${code}`, { method: "PUT", headers: entetes, body: corps })).code;
    } catch (cause) {
      // Document purge cote serveur : on recree plutot que de perdre la saisie de l'utilisateur.
      if (!(cause instanceof ApiError && cause.statut === 404)) {
        throw cause;
      }
    }
  }
  const enveloppe = await requeteCv("/cv", { method: "POST", headers: entetes, body: corps });
  window.localStorage.setItem(CLE_CODE, enveloppe.code);
  return enveloppe.code;
}

/**
 * Droit a l'effacement : retire le CV du serveur, puis oublie le code et le brouillon local.
 * Un code deja inconnu du serveur (404) est traite comme un succes — le but est atteint.
 */
export async function supprimerCvServeur(): Promise<void> {
  const code = lireCodeCv();
  if (code) {
    try {
      await requeteCv(`/cv/${code}`, { method: "DELETE" });
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.statut === 404)) {
        throw cause;
      }
    }
  }
  window.localStorage.removeItem(CLE_CODE);
  window.localStorage.removeItem(CLE_LOCALE);
}

/**
 * Copie locale du CV : le brouillon de secours de ce navigateur, utilise quand CvMS est muet.
 * La sauvegarde serveur reste la reference — c'est elle qui suit l'utilisateur via son code.
 */
export function lireCvLocal(): CvData | null {
  if (typeof window === "undefined") {
    return null;
  }
  const brut = window.localStorage.getItem(CLE_LOCALE);
  if (!brut) {
    return null;
  }
  try {
    return { ...CV_VIDE, ...(JSON.parse(brut) as Partial<CvData>) };
  } catch {
    return null;
  }
}

export function enregistrerCvLocal(cv: CvData): void {
  window.localStorage.setItem(CLE_LOCALE, JSON.stringify(cv));
}
