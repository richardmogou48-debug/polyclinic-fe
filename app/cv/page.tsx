"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Field, controle } from "@/components/form/Field";
import SectionMessage from "@/components/dashboard/SectionMessage";
import { ApiError } from "@/lib/api";
import {
  CV_VIDE,
  EXPERIENCE_VIDE,
  FORMATION_VIDE,
  LANGUE_VIDE,
  chargerCvParCode,
  chargerCvServeur,
  enregistrerCvLocal,
  enregistrerCvServeur,
  lireCodeCv,
  lireCvLocal,
  supprimerCvServeur,
  type CvData,
} from "@/lib/cv";

/**
 * Editeur de CV — service PUBLIC, sans compte ni aucun lien avec le reste de l'application.
 *
 * La sauvegarde remet un code de reprise (UUID) : ce navigateur le garde, et l'utilisateur peut
 * le noter pour retrouver son CV depuis n'importe quel appareil. Personne d'autre que le
 * detenteur du code ne peut lire le document.
 *
 * Un seul jeu de donnees alimente les trois gabarits (canadien, francais, anglais) : on saisit
 * une fois, on imprime aux trois formats. Les champs propres a un usage national (etat civil et
 * photo pour la France, complement CNP pour le Canada) sont annonces comme tels — les autres
 * gabarits les ignorent, il n'y a rien a cocher.
 */
const BOUTON =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-secondary-500 " +
  "transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60";

const BOUTON_PRINCIPAL =
  "rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors " +
  "duration-250 ease-smooth hover:bg-primary-600 focus:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60";

/** Au-dela, la photo alourdirait le document au point de gener la sauvegarde et l'impression. */
const PHOTO_MAX_OCTETS = 500 * 1024;

const MODELES = [
  { href: "/print/cv/canadien", libelle: "Modèle canadien" },
  { href: "/print/cv/francais", libelle: "Modèle français" },
  { href: "/print/cv/anglais", libelle: "Modèle anglais" },
];

export default function Page() {
  const photoRef = useRef<HTMLInputElement>(null);

  const [cv, setCv] = useState<CvData>(CV_VIDE);
  const [initialise, setInitialise] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  /** Code de reprise du CV sauvegarde, affiche pour que l'utilisateur puisse le noter. */
  const [code, setCode] = useState<string | null>(null);
  const [codeSaisi, setCodeSaisi] = useState("");

  useEffect(() => {
    let actif = true;
    chargerCvServeur()
      .then((distant) => {
        if (!actif) return;
        if (distant) {
          setCv(distant);
          setCode(lireCodeCv());
        } else {
          const local = lireCvLocal();
          if (local) setCv(local);
        }
      })
      .catch(() => {
        // CvMS muet : le brouillon local du navigateur, s'il existe, vaut mieux qu'une page vide.
        const local = lireCvLocal();
        if (actif && local) setCv(local);
      })
      .finally(() => {
        if (actif) setInitialise(true);
      });
    return () => {
      actif = false;
    };
  }, []);

  if (!initialise) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <SectionMessage variant="loading" title="Chargement de votre CV…" />
      </main>
    );
  }

  const champ = <K extends keyof CvData>(cle: K, valeur: CvData[K]) =>
    setCv((actuel) => ({ ...actuel, [cle]: valeur }));

  const chargerPhoto = (fichier: File) => {
    if (!["image/jpeg", "image/png"].includes(fichier.type)) {
      setErreur("La photo doit être un JPEG ou un PNG.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const dataUrl = String(lecteur.result ?? "");
      if (dataUrl.length > PHOTO_MAX_OCTETS) {
        setErreur("La photo est trop lourde (350 Ko maximum) : réduisez-la avant de la charger.");
        return;
      }
      setErreur(null);
      champ("photo", dataUrl);
    };
    lecteur.readAsDataURL(fichier);
  };

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreur(null);
    setSucces(null);
    if (!cv.nom.trim()) {
      setErreur("Le CV doit au moins porter votre nom.");
      return;
    }
    // Toujours en local d'abord : meme si CvMS est muet, la saisie n'est jamais perdue et les
    // modeles d'impression restent utilisables sur ce poste.
    enregistrerCvLocal(cv);
    setEnCours(true);
    try {
      setCode(await enregistrerCvServeur(cv));
      setSucces("CV enregistré. Choisissez un modèle ci-dessous pour l'imprimer.");
    } catch (cause) {
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreur(
        (attendu ? cause.message : "Une erreur inattendue est survenue.") +
          " Votre CV est tout de même enregistré dans ce navigateur, et imprimable depuis ce poste."
      );
    } finally {
      setEnCours(false);
    }
  };

  /** Droit a l'effacement : retire le CV du serveur et de ce navigateur, apres confirmation. */
  const supprimer = async () => {
    if (!window.confirm("Supprimer définitivement votre CV du serveur et de ce navigateur ?")) {
      return;
    }
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      await supprimerCvServeur();
      setCv(CV_VIDE);
      setCode(null);
      setSucces("CV supprimé. Vous pouvez en ressaisir un quand vous voulez.");
    } catch (cause) {
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreur(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  /** Reprise depuis un autre appareil : le code saisi devient celui de ce navigateur. */
  const reprendre = async () => {
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const distant = await chargerCvParCode(codeSaisi);
      if (!distant) {
        setErreur("Le CV retrouvé est illisible : vérifiez le code.");
        return;
      }
      setCv(distant);
      setCode(lireCodeCv());
      setCodeSaisi("");
      enregistrerCvLocal(distant);
      setSucces("CV retrouvé. Vous pouvez le modifier ou l'imprimer.");
    } catch (cause) {
      const introuvable = cause instanceof ApiError && cause.statut === 404;
      if (!(cause instanceof ApiError)) console.error(cause);
      setErreur(
        introuvable
          ? "Aucun CV ne correspond à ce code."
          : cause instanceof ApiError
            ? cause.message
            : "Une erreur inattendue est survenue."
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-secondary-500">Mon CV</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Saisissez une fois, imprimez aux formats canadien, français ou anglais. Aucun compte
            nécessaire : ce service est ouvert à tous.
          </p>
          {code && (
            <p className="mt-1 text-xs text-neutral-500">
              Votre code de reprise : <code className="rounded bg-neutral-100 px-1 font-mono">{code}</code>{" "}
              — notez-le pour retrouver votre CV depuis un autre appareil.
            </p>
          )}
        </div>
        <Link href="/" className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline">
          ← Accueil du site
        </Link>
      </header>

      {/* Reprise depuis un autre appareil : le code remis a la sauvegarde est la seule cle. */}
      {!code && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white px-5 py-4">
          <div className="min-w-64 flex-1">
            <Field id="cv-code" label="Vous avez déjà un code de reprise ?" aide="Saisissez-le pour retrouver le CV enregistré depuis un autre appareil.">
              <input id="cv-code" type="text" value={codeSaisi} onChange={(e) => setCodeSaisi(e.target.value)} disabled={enCours} className={controle()} />
            </Field>
          </div>
          <button type="button" onClick={reprendre} disabled={enCours || !codeSaisi.trim()} className={BOUTON}>
            Reprendre mon CV
          </button>
        </div>
      )}

      {erreur && (
        <p role="alert" className="mb-4 rounded-md bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700">
          {erreur}
        </p>
      )}
      {succes && (
        <div className="mb-4 rounded-md bg-primary-50 px-4 py-3">
          <p role="status" className="text-sm font-medium text-primary-700">{succes}</p>
          <p className="mt-2 flex flex-wrap gap-4">
            {MODELES.map((modele) => (
              <a
                key={modele.href}
                href={modele.href}
                target="_blank"
                rel="noopener"
                className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
              >
                {modele.libelle}
              </a>
            ))}
          </p>
        </div>
      )}

      <form onSubmit={soumettre} className="flex flex-col gap-6">
        <Bloc titre="Identité">
          <Field id="cv-nom" label="Nom complet" requis>
            <input id="cv-nom" type="text" value={cv.nom} onChange={(e) => champ("nom", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-titre" label="Titre professionnel" aide="Ex. : Infirmière clinicienne — soins ambulatoires.">
            <input id="cv-titre" type="text" value={cv.titre} onChange={(e) => champ("titre", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-localisation" label="Ville, région, pays">
            <input id="cv-localisation" type="text" value={cv.localisation} onChange={(e) => champ("localisation", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-telephone" label="Téléphone">
            <input id="cv-telephone" type="text" value={cv.telephone} onChange={(e) => champ("telephone", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-email" label="Email">
            <input id="cv-email" type="text" value={cv.email} onChange={(e) => champ("email", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-lien" label="LinkedIn / site">
            <input id="cv-lien" type="text" value={cv.lienWeb} onChange={(e) => champ("lienWeb", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="cv-mobilite" label="Mention de mobilité" aide="Ex. : Admissible à un permis de travail — Entrée express. Affichée sur les modèles canadien et anglais.">
              <input id="cv-mobilite" type="text" value={cv.mentionMobilite} onChange={(e) => champ("mentionMobilite", e.target.value)} disabled={enCours} className={controle()} />
            </Field>
          </div>
        </Bloc>

        <Bloc
          titre="État civil et photo — modèle français uniquement"
          note="L'usage canadien et l'usage britannique les proscrivent : ces champs n'apparaissent que sur le modèle français, et seulement s'ils sont renseignés."
        >
          <Field id="cv-age" label="Âge">
            <input id="cv-age" type="text" placeholder="34 ans" value={cv.age} onChange={(e) => champ("age", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-etat-civil" label="Situation">
            <input id="cv-etat-civil" type="text" placeholder="Célibataire" value={cv.etatCivil} onChange={(e) => champ("etatCivil", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-nationalite" label="Nationalité">
            <input id="cv-nationalite" type="text" value={cv.nationalite} onChange={(e) => champ("nationalite", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-permis" label="Permis de conduire">
            <input id="cv-permis" type="text" placeholder="Permis B — véhicule personnel" value={cv.permisConduire} onChange={(e) => champ("permisConduire", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <div className="sm:col-span-2 flex items-end gap-4">
            <div className="flex-1">
              <Field id="cv-photo" label="Photo (JPEG ou PNG, 350 Ko max)">
                <input
                  ref={photoRef}
                  id="cv-photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={enCours}
                  onChange={(e) => {
                    const fichier = e.target.files?.[0];
                    if (fichier) chargerPhoto(fichier);
                  }}
                  className="mt-1 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-500 hover:file:bg-neutral-100"
                />
              </Field>
            </div>
            {cv.photo && (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cv.photo} alt="Aperçu de la photo" className="h-20 w-16 rounded object-cover grayscale" />
                <button
                  type="button"
                  onClick={() => {
                    champ("photo", null);
                    if (photoRef.current) photoRef.current.value = "";
                  }}
                  disabled={enCours}
                  className={BOUTON}
                >
                  Retirer
                </button>
              </div>
            )}
          </div>
        </Bloc>

        <Bloc titre="Profil">
          <div className="sm:col-span-2">
            <Field id="cv-profil" label="Résumé / personal statement" aide="Quatre à cinq lignes : qui vous êtes, votre expérience, ce que vous cherchez.">
              <textarea id="cv-profil" rows={4} value={cv.profil} onChange={(e) => champ("profil", e.target.value)} disabled={enCours} className={controle()} />
            </Field>
          </div>
        </Bloc>

        <Bloc titre="Expériences professionnelles">
          <div className="sm:col-span-2 flex flex-col gap-4">
            {cv.experiences.map((exp, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-2">
                <Field id={`exp-poste-${index}`} label="Poste" >
                  <input id={`exp-poste-${index}`} type="text" value={exp.poste} onChange={(e) => majListe("experiences", index, { poste: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`exp-periode-${index}`} label="Période" aide="Ex. : Mars 2021 – présent.">
                  <input id={`exp-periode-${index}`} type="text" value={exp.periode} onChange={(e) => majListe("experiences", index, { periode: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`exp-employeur-${index}`} label="Employeur">
                  <input id={`exp-employeur-${index}`} type="text" value={exp.employeur} onChange={(e) => majListe("experiences", index, { employeur: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`exp-lieu-${index}`} label="Lieu">
                  <input id={`exp-lieu-${index}`} type="text" value={exp.lieu} onChange={(e) => majListe("experiences", index, { lieu: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <div className="sm:col-span-2">
                  <Field id={`exp-complement-${index}`} label="Complément canadien" aide="Ex. : 40 h/semaine · CNP 31301. Affiché par le seul modèle canadien.">
                    <input id={`exp-complement-${index}`} type="text" value={exp.complement} onChange={(e) => majListe("experiences", index, { complement: e.target.value })} disabled={enCours} className={controle()} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field id={`exp-realisations-${index}`} label="Réalisations — une par ligne" aide="Des faits chiffrés : « A réduit de 35 % le délai d'attente au triage. »">
                    <textarea id={`exp-realisations-${index}`} rows={3} value={exp.realisations} onChange={(e) => majListe("experiences", index, { realisations: e.target.value })} disabled={enCours} className={controle()} />
                  </Field>
                </div>
                <div>
                  <button type="button" onClick={() => retirerDeListe("experiences", index)} disabled={enCours || cv.experiences.length === 1} className={BOUTON}>
                    Retirer cette expérience
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button type="button" onClick={() => ajouterAListe("experiences", { ...EXPERIENCE_VIDE })} disabled={enCours} className={BOUTON}>
                Ajouter une expérience
              </button>
            </div>
          </div>
        </Bloc>

        <Bloc titre="Formation">
          <div className="sm:col-span-2 flex flex-col gap-4">
            {cv.formations.map((formation, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[2fr_1fr]">
                <Field id={`for-diplome-${index}`} label="Diplôme">
                  <input id={`for-diplome-${index}`} type="text" value={formation.diplome} onChange={(e) => majListe("formations", index, { diplome: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`for-annee-${index}`} label="Année">
                  <input id={`for-annee-${index}`} type="text" value={formation.annee} onChange={(e) => majListe("formations", index, { annee: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`for-etablissement-${index}`} label="Établissement">
                  <input id={`for-etablissement-${index}`} type="text" value={formation.etablissement} onChange={(e) => majListe("formations", index, { etablissement: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`for-complement-${index}`} label="Mention / équivalence" aide="Ex. : mention bien, ou évaluation WES.">
                  <input id={`for-complement-${index}`} type="text" value={formation.complement} onChange={(e) => majListe("formations", index, { complement: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <div>
                  <button type="button" onClick={() => retirerDeListe("formations", index)} disabled={enCours || cv.formations.length === 1} className={BOUTON}>
                    Retirer
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button type="button" onClick={() => ajouterAListe("formations", { ...FORMATION_VIDE })} disabled={enCours} className={BOUTON}>
                Ajouter une formation
              </button>
            </div>
          </div>
        </Bloc>

        <Bloc titre="Compétences, certifications, langues, intérêts">
          <Field id="cv-competences" label="Compétences — une par ligne">
            <textarea id="cv-competences" rows={5} value={cv.competences} onChange={(e) => champ("competences", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-certifications" label="Certifications et permis — une par ligne">
            <textarea id="cv-certifications" rows={5} value={cv.certifications} onChange={(e) => champ("certifications", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <div className="sm:col-span-2 flex flex-col gap-3">
            {cv.langues.map((langue, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                <Field id={`lan-langue-${index}`} label={index === 0 ? "Langue" : ""}>
                  <input id={`lan-langue-${index}`} type="text" value={langue.langue} onChange={(e) => majListe("langues", index, { langue: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <Field id={`lan-niveau-${index}`} label={index === 0 ? "Niveau" : ""} aide={index === 0 ? "C1 pour la France, NCLC/IELTS pour le Canada — du texte libre." : undefined}>
                  <input id={`lan-niveau-${index}`} type="text" value={langue.niveau} onChange={(e) => majListe("langues", index, { niveau: e.target.value })} disabled={enCours} className={controle()} />
                </Field>
                <div className="flex items-end">
                  <button type="button" onClick={() => retirerDeListe("langues", index)} disabled={enCours || cv.langues.length === 1} className={BOUTON}>
                    Retirer
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button type="button" onClick={() => ajouterAListe("langues", { ...LANGUE_VIDE })} disabled={enCours} className={BOUTON}>
                Ajouter une langue
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Field id="cv-interets" label="Centres d'intérêt — un par ligne (modèle français)">
              <textarea id="cv-interets" rows={3} value={cv.interets} onChange={(e) => champ("interets", e.target.value)} disabled={enCours} className={controle()} />
            </Field>
          </div>
        </Bloc>

        <Bloc titre="Bénévolat">
          <Field id="cv-benevolat-titre" label="Organisation">
            <input id="cv-benevolat-titre" type="text" value={cv.benevolatTitre} onChange={(e) => champ("benevolatTitre", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <Field id="cv-benevolat-periode" label="Période">
            <input id="cv-benevolat-periode" type="text" value={cv.benevolatPeriode} onChange={(e) => champ("benevolatPeriode", e.target.value)} disabled={enCours} className={controle()} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="cv-benevolat-description" label="Description">
              <textarea id="cv-benevolat-description" rows={2} value={cv.benevolatDescription} onChange={(e) => champ("benevolatDescription", e.target.value)} disabled={enCours} className={controle()} />
            </Field>
          </div>
        </Bloc>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={enCours} className={BOUTON_PRINCIPAL}>
            {enCours ? "Enregistrement…" : "Enregistrer mon CV"}
          </button>
          <span className="flex flex-wrap gap-4">
            {MODELES.map((modele) => (
              <a key={modele.href} href={modele.href} target="_blank" rel="noopener" className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline">
                {modele.libelle}
              </a>
            ))}
          </span>
          {code && (
            <button type="button" onClick={supprimer} disabled={enCours} className={`${BOUTON} ml-auto`}>
              Supprimer mon CV du serveur
            </button>
          )}
        </div>
      </form>
    </main>
  );

  /** Met a jour un element d'une des trois listes (experiences, formations, langues). */
  function majListe<K extends "experiences" | "formations" | "langues">(
    cle: K,
    index: number,
    modification: Partial<CvData[K][number]>
  ) {
    setCv((actuel) => ({
      ...actuel,
      [cle]: actuel[cle].map((element, i) => (i === index ? { ...element, ...modification } : element)),
    }));
  }

  function ajouterAListe<K extends "experiences" | "formations" | "langues">(cle: K, vide: CvData[K][number]) {
    setCv((actuel) => ({ ...actuel, [cle]: [...actuel[cle], vide] }));
  }

  function retirerDeListe<K extends "experiences" | "formations" | "langues">(cle: K, index: number) {
    setCv((actuel) => ({
      ...actuel,
      [cle]: actuel[cle].length === 1 ? actuel[cle] : actuel[cle].filter((_, i) => i !== index),
    }));
  }
}

function Bloc({ titre, note, children }: { titre: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <header className="border-b border-neutral-200 px-5 py-3">
        <h2 className="font-heading text-base font-semibold text-secondary-500">{titre}</h2>
        {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
      </header>
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
