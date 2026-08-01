"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  CATEGORIES_MEDICAMENT,
  TYPES_MEDICAMENT,
  mettreAJourMedicament,
  referencerMedicament,
  type Medicine,
  type MedicineCategory,
  type MedicineType,
} from "@/lib/pharmacy";

/**
 * Fiche d'un medicament au catalogue : creation ou modification.
 *
 * Les deux gestes partagent le meme formulaire parce qu'ils portent exactement les memes champs —
 * le backend distingue la creation de la mise a jour par la seule presence d'un identifiant. Les
 * separer dupliquerait la saisie sans rien clarifier.
 *
 * Ce formulaire ne touche PAS au stock. Aucune route ne permet aujourd'hui d'entrer un lot,
 * sa quantite ou sa peremption : /pharmacy/medicines/inventory est en lecture seule. Le stock ne
 * peut donc etre alimente que directement en base, ce qui est une lacune du backend et non un
 * ecran manquant.
 */
type Erreurs = Partial<Record<"nom" | "dosage" | "prix", string>>;

export default function MedicineForm({
  medicament,
  onEnregistre,
  dansModale = false,
}: {
  /** Present : on modifie cette fiche. Absent : on en cree une. */
  medicament?: Medicine | null;
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [name, setName] = useState(medicament?.name ?? "");
  const [dosage, setDosage] = useState(medicament?.dosage ?? "");
  const [category, setCategory] = useState<MedicineCategory>(medicament?.category ?? "ANTIBIOTIC");
  const [type, setType] = useState<MedicineType>(medicament?.type ?? "TABLET");
  const [manufacturer, setManufacturer] = useState(medicament?.manufacturer ?? "");
  const [unitPrice, setUnitPrice] = useState(
    medicament?.unitPrice === null || medicament?.unitPrice === undefined
      ? ""
      : String(medicament.unitPrice)
  );

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const modification = Boolean(medicament);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const prix = Number(unitPrice.trim());
    const trouvees: Erreurs = {};
    if (!name.trim()) trouvees.nom = "Le nom est obligatoire.";
    // Le dosage fait partie de l'identite du produit : « amoxicilline » sans 500 mg ne se
    // prescrit pas, et deux dosages sont deux lignes de catalogue.
    if (!dosage.trim()) trouvees.dosage = "Le dosage est obligatoire.";
    if (!unitPrice.trim() || !Number.isInteger(prix) || prix < 0) {
      trouvees.prix = "Le prix est un entier positif, en francs CFA.";
    }
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const saisie = {
      id: medicament?.id ?? null,
      name: name.trim(),
      dosage: dosage.trim(),
      category,
      type,
      manufacturer: manufacturer.trim() || null,
      unitPrice: prix,
    };

    setEnCours(true);
    try {
      if (modification) {
        await mettreAJourMedicament(saisie, session.token);
        setSucces("Fiche mise à jour.");
      } else {
        await referencerMedicament(saisie, session.token);
        setSucces(`Médicament référencé : ${name.trim()}`);
        setName("");
        setDosage("");
        setManufacturer("");
        setUnitPrice("");
      }
      onEnregistre?.();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
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
      titre={modification ? "Modifier la fiche" : "Référencer un médicament"}
      description="Le catalogue ne porte pas le stock : les lots et les péremptions se gèrent ailleurs."
      dansModale={dansModale}
      actionLibelle={modification ? "Enregistrer les modifications" : "Référencer"}
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field id="medicament-nom" label="Nom" requis erreur={erreurs.nom}>
        <input
          id="medicament-nom"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.nom ? true : undefined}
          className={controle(erreurs.nom)}
        />
      </Field>

      <Field
        id="medicament-dosage"
        label="Dosage"
        requis
        erreur={erreurs.dosage}
        aide="Fait partie de l'identité du produit : deux dosages sont deux fiches."
      >
        <input
          id="medicament-dosage"
          type="text"
          placeholder="500 mg"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.dosage ? true : undefined}
          className={controle(erreurs.dosage)}
        />
      </Field>

      <Field id="medicament-categorie" label="Catégorie">
        <select
          id="medicament-categorie"
          value={category}
          onChange={(e) => setCategory(e.target.value as MedicineCategory)}
          disabled={enCours}
          className={controle()}
        >
          {CATEGORIES_MEDICAMENT.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <Field id="medicament-forme" label="Forme">
        <select
          id="medicament-forme"
          value={type}
          onChange={(e) => setType(e.target.value as MedicineType)}
          disabled={enCours}
          className={controle()}
        >
          {TYPES_MEDICAMENT.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <Field id="medicament-fabricant" label="Fabricant">
        <input
          id="medicament-fabricant"
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>

      <Field id="medicament-prix" label="Prix unitaire (FCFA)" requis erreur={erreurs.prix}>
        <input
          id="medicament-prix"
          type="number"
          min={0}
          step={1}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.prix ? true : undefined}
          className={controle(erreurs.prix)}
        />
      </Field>
    </FormShell>
  );
}
