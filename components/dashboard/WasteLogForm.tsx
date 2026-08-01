"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  METHODES_ELIMINATION,
  TYPES_DECHET,
  consignerDechet,
  type DisposalMethod,
  type WasteType,
} from "@/lib/facilities";

/**
 * Registre d'elimination des dechets biomedicaux.
 *
 * Ce n'est pas une note interne : le bordereau d'elimination est une piece reglementaire, et
 * c'est lui qu'un inspecteur demande. D'ou son champ dedie, place au meme rang que la quantite
 * plutot que relegue dans des observations.
 *
 * Type de dechet et methode d'elimination sont contraints parce qu'ils vont par paires : des
 * objets piquants ne partent pas en decharge, meme speciale. La coherence n'est pas verifiee ici
 * — le backend ne la verifie pas non plus — mais la liste fermee evite au moins les valeurs
 * fantaisistes dans un registre opposable.
 */
type Erreurs = Partial<Record<"quantite" | "lieu" | "date", string>>;

export default function WasteLogForm({
  onConsigne,
  dansModale = false,
}: {
  onConsigne?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [wasteType, setWasteType] = useState<WasteType>("INFECTIOUS");
  const [quantite, setQuantite] = useState("");
  const [location, setLocation] = useState("");
  const [quand, setQuand] = useState("");
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod>("INCINERATION");
  const [bordereau, setBordereau] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const poids = Number(quantite.trim().replace(",", "."));
    const trouvees: Erreurs = {};
    if (!quantite.trim() || !Number.isFinite(poids) || poids <= 0) {
      trouvees.quantite = "Indiquez un poids positif, en kilogrammes.";
    }
    if (!location.trim()) trouvees.lieu = "Indiquez le lieu de collecte.";
    if (!quand) trouvees.date = "Indiquez la date de collecte.";
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await consignerDechet(
        {
          wasteType,
          quantityKg: poids,
          location: location.trim(),
          collectionDate: quand.length === 16 ? `${quand}:00` : quand,
          // Texte libre cote backend, non rapproche d'un compte : le nom de la session est la
          // valeur qui a le plus de chances d'etre exacte.
          collectedBy: session.name || null,
          disposalMethod,
          disposalCertificateRef: bordereau.trim() || null,
        },
        session.token
      );

      setSucces("Élimination consignée.");
      setQuantite("");
      setLocation("");
      setQuand("");
      setBordereau("");
      onConsigne?.();
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
      titre="Consigner une élimination"
      description="Registre réglementaire : la référence du bordereau est ce qu'un inspecteur demande."
      dansModale={dansModale}
      actionLibelle="Consigner"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field id="dechet-type" label="Type de déchet">
        <select
          id="dechet-type"
          value={wasteType}
          onChange={(e) => setWasteType(e.target.value as WasteType)}
          disabled={enCours}
          className={controle()}
        >
          {TYPES_DECHET.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <Field id="dechet-quantite" label="Quantité (kg)" requis erreur={erreurs.quantite}>
        <input
          id="dechet-quantite"
          type="text"
          inputMode="decimal"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.quantite ? true : undefined}
          className={controle(erreurs.quantite)}
        />
      </Field>

      <Field id="dechet-lieu" label="Lieu de collecte" requis erreur={erreurs.lieu}>
        <input
          id="dechet-lieu"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.lieu ? true : undefined}
          className={controle(erreurs.lieu)}
        />
      </Field>

      <Field id="dechet-date" label="Date de collecte" requis erreur={erreurs.date}>
        <input
          id="dechet-date"
          type="datetime-local"
          value={quand}
          onChange={(e) => setQuand(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.date ? true : undefined}
          className={controle(erreurs.date)}
        />
      </Field>

      <Field id="dechet-methode" label="Méthode d'élimination">
        <select
          id="dechet-methode"
          value={disposalMethod}
          onChange={(e) => setDisposalMethod(e.target.value as DisposalMethod)}
          disabled={enCours}
          className={controle()}
        >
          {METHODES_ELIMINATION.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="dechet-bordereau"
        label="Référence du bordereau"
        aide="Pièce réglementaire délivrée par le prestataire d'élimination."
      >
        <input
          id="dechet-bordereau"
          type="text"
          value={bordereau}
          onChange={(e) => setBordereau(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>
    </FormShell>
  );
}
