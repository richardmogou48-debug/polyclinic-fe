"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { prescrire, type LigneOrdonnance } from "@/lib/consultations";
import { fetchMedicines } from "@/lib/pharmacy";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Ordonnance de medicaments.
 *
 * Deux points meritent d'etre lus avant de modifier ce fichier.
 *
 * La regle « pas de medicament sans resultat d'examen » n'est PAS reimplementee ici. Le
 * formulaire tente l'enregistrement ; c'est le backend qui refuse en 409, et ce refus devoile le
 * champ de derogation. La regle n'a ainsi qu'un seul endroit ou vivre, et une interface qui
 * l'aurait mal recopiee ne pourrait pas laisser passer ce que le serveur interdit. L'avertissement
 * affiche en amont, lui, n'est qu'un confort : il ne decide de rien.
 *
 * Le medicament se saisit librement, avec le catalogue en suggestion. Une liste fermee empecherait
 * de prescrire ce que la pharmacie n'a pas encore reference, et le medecin prescrit d'abord pour
 * le patient, pas pour le stock. Quand la saisie correspond a une entree du catalogue, sa
 * reference part avec — le backend la valide alors aupres de PharmacyMS et complete le nom.
 */
type Ligne = { medicineName: string; dosage: string; duration: string };

const LIGNE_VIDE: Ligne = { medicineName: "", dosage: "", duration: "" };

export default function PrescriptionForm({
  entryId,
  examensEnAttente = false,
  onPrescrit,
  dansModale = false,
}: {
  entryId: number;
  /** Confort d'affichage seulement : le refus fait autorite, pas ce drapeau. */
  examensEnAttente?: boolean;
  onPrescrit?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [lignes, setLignes] = useState<Ligne[]>([{ ...LIGNE_VIDE }]);
  const [derogationMotif, setDerogationMotif] = useState("");
  /** Devoile par un refus 409, ou d'emblee si l'appelant sait qu'un examen est en attente. */
  const [derogationRequise, setDerogationRequise] = useState(examensEnAttente);

  const [erreurLignes, setErreurLignes] = useState<string | undefined>();
  const [erreurMotif, setErreurMotif] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Le catalogue n'est qu'une aide a la saisie : son echec ne doit pas empecher de prescrire.
  // L'etat « erreur » est donc traite comme une absence de suggestions, sans message.
  const catalogue = useAuthenticatedResource((session) => fetchMedicines(session.token));
  const medicaments = catalogue.phase === "pret" ? catalogue.donnees : [];

  const modifier = (index: number, champ: keyof Ligne, valeur: string) =>
    setLignes((actuelles) =>
      actuelles.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne))
    );

  const ajouterLigne = () => setLignes((actuelles) => [...actuelles, { ...LIGNE_VIDE }]);

  // La derniere ligne n'est jamais supprimable : un formulaire sans aucune ligne n'offrirait plus
  // de champ ou saisir, et il faudrait le recharger pour s'en sortir.
  const retirerLigne = (index: number) =>
    setLignes((actuelles) => (actuelles.length === 1 ? actuelles : actuelles.filter((_, i) => i !== index)));

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const retenues = lignes.filter((ligne) => ligne.medicineName.trim());
    if (retenues.length === 0) {
      setErreurLignes("Une ordonnance doit porter au moins un médicament.");
      return;
    }
    // Posologie et duree sont NOT NULL cote entite : les omettre ferait echouer l'enregistrement
    // sur une contrainte de base. Et une ordonnance sans posologie n'est de toute facon pas une
    // ordonnance.
    if (retenues.some((ligne) => !ligne.dosage.trim() || !ligne.duration.trim())) {
      setErreurLignes("Chaque médicament doit porter une posologie et une durée.");
      return;
    }
    setErreurLignes(undefined);

    if (derogationRequise && !derogationMotif.trim()) {
      setErreurMotif("Écrivez pourquoi vous prescrivez sans attendre les résultats.");
      return;
    }
    setErreurMotif(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const items: LigneOrdonnance[] = retenues.map((ligne) => {
      const saisi = ligne.medicineName.trim();
      // Correspondance exacte avec le catalogue : le nom saisi est celui affiche dans la liste.
      const connu = medicaments.find((m) => m.name?.trim().toLowerCase() === saisi.toLowerCase());
      return {
        medicineId: connu?.id ?? null,
        medicineName: saisi,
        dosage: ligne.dosage.trim(),
        duration: ligne.duration.trim(),
      };
    });

    setEnCours(true);
    try {
      await prescrire(
        entryId,
        { items, derogationMotif: derogationRequise ? derogationMotif.trim() : null },
        session.token
      );

      setSucces(`Ordonnance enregistrée — ${items.length} médicament${items.length > 1 ? "s" : ""}.`);
      setLignes([{ ...LIGNE_VIDE }]);
      setDerogationMotif("");
      setDerogationRequise(false);
      onPrescrit?.();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      // 409 : des examens n'ont pas rendu. Ce n'est pas une panne, c'est la regle qui s'applique.
      // On devoile le champ et on reprend le motif du serveur — la saisie du medecin est intacte,
      // il lui reste a ecrire pourquoi il passe outre.
      if (cause instanceof ApiError && cause.statut === 409) {
        setDerogationRequise(true);
        setErreurGlobale(cause.message);
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreurGlobale(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <FormShell
      titre="Prescrire un traitement"
      description="Le médicament se saisit librement ; le catalogue de la pharmacie est proposé en suggestion."
      dansModale={dansModale}
      actionLibelle="Enregistrer l'ordonnance"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      {/* Le catalogue alimente les suggestions de toutes les lignes : un seul datalist suffit. */}
      <datalist id="catalogue-medicaments">
        {medicaments.map((medicament) => (
          <option key={medicament.id} value={medicament.name ?? ""}>
            {medicament.dosage ?? ""}
          </option>
        ))}
      </datalist>

      <div className="sm:col-span-2 flex flex-col gap-3">
        {lignes.map((ligne, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[2fr_1.5fr_1fr_auto]"
          >
            <Field id={`medicament-${index}`} label={index === 0 ? "Médicament" : ""} requis={index === 0}>
              <input
                id={`medicament-${index}`}
                type="text"
                list="catalogue-medicaments"
                value={ligne.medicineName}
                onChange={(e) => modifier(index, "medicineName", e.target.value)}
                disabled={enCours}
                className={controle()}
              />
            </Field>

            <Field id={`posologie-${index}`} label={index === 0 ? "Posologie" : ""}>
              <input
                id={`posologie-${index}`}
                type="text"
                placeholder="1 cp x3/j"
                value={ligne.dosage}
                onChange={(e) => modifier(index, "dosage", e.target.value)}
                disabled={enCours}
                className={controle()}
              />
            </Field>

            <Field id={`duree-${index}`} label={index === 0 ? "Durée" : ""}>
              <input
                id={`duree-${index}`}
                type="text"
                placeholder="7 jours"
                value={ligne.duration}
                onChange={(e) => modifier(index, "duration", e.target.value)}
                disabled={enCours}
                className={controle()}
              />
            </Field>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => retirerLigne(index)}
                disabled={enCours || lignes.length === 1}
                aria-label={`Retirer le médicament ${index + 1}`}
                className="rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors duration-250 ease-smooth hover:bg-neutral-200 hover:text-secondary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}

        {erreurLignes && (
          <p role="alert" className="text-xs font-medium text-accent-700">
            {erreurLignes}
          </p>
        )}

        <div>
          <button
            type="button"
            onClick={ajouterLigne}
            disabled={enCours}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ajouter un médicament
          </button>
        </div>
      </div>

      {/* Devoile par le refus du serveur, ou d'emblee quand l'ecran sait deja qu'un examen est en
          attente. Le motif est conserve dans le dossier et affiche sous l'ordonnance : c'est le
          seul interet de l'avoir exige. */}
      {derogationRequise && (
        <div
          ref={(bloc) => bloc?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
          className="sm:col-span-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Examens en attente de résultat
          </p>
          <p className="mt-1 text-sm text-amber-900">
            Prescrire maintenant reste possible, mais le motif sera conservé dans le dossier et
            visible sous l&apos;ordonnance.
          </p>
          <div className="mt-2">
            <Field id="derogation" label="Motif" requis erreur={erreurMotif}>
              <textarea
                id="derogation"
                rows={2}
                value={derogationMotif}
                onChange={(e) => setDerogationMotif(e.target.value)}
                disabled={enCours}
                aria-invalid={erreurMotif ? true : undefined}
                className={controle(erreurMotif)}
              />
            </Field>
          </div>
        </div>
      )}
    </FormShell>
  );
}
