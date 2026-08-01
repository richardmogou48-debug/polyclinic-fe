"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { TYPES_EQUIPEMENT, enregistrerEquipement, type EquipmentType } from "@/lib/facilities";

/**
 * Entree d'un equipement au parc.
 *
 * Les deux echeances — maintenance preventive et etalonnage — sont saisies a l'entree parce que
 * c'est le seul moment ou on les connait : elles figurent sur les documents du fournisseur, qui
 * ne repasseront pas. Les remettre a plus tard revient a ne jamais les renseigner, et un parc
 * sans echeances ne se pilote pas.
 *
 * Le statut n'est pas saisissable : le backend pose ACTIVE. Un equipement enregistre directement
 * comme hors service n'aurait jamais ete recu.
 */
type Erreurs = Partial<Record<"nom" | "serie", string>>;

export default function EquipmentForm({
  onEnregistre,
  dansModale = false,
}: {
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [type, setType] = useState<EquipmentType>("MEDICAL_DEVICE");
  const [currentLocation, setCurrentLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [etalonnage, setEtalonnage] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees: Erreurs = {};
    if (!name.trim()) trouvees.nom = "Le nom est obligatoire.";
    // Le numero de serie est ce qui distingue deux appareils identiques : sans lui, une
    // maintenance consignee ne se rattache a rien de precis.
    if (!serialNumber.trim()) trouvees.serie = "Le numéro de série est obligatoire.";
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await enregistrerEquipement(
        {
          name: name.trim(),
          serialNumber: serialNumber.trim(),
          type,
          currentLocation: currentLocation.trim() || null,
          purchaseDate: purchaseDate || null,
          nextPreventiveMaintenanceDate: maintenance || null,
          nextCalibrationDate: etalonnage || null,
        },
        session.token
      );

      setSucces(`Équipement enregistré : ${name.trim()}`);
      setName("");
      setSerialNumber("");
      setCurrentLocation("");
      setPurchaseDate("");
      setMaintenance("");
      setEtalonnage("");
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
      titre="Enregistrer un équipement"
      description="Renseignez les échéances maintenant : elles figurent sur les documents du fournisseur."
      dansModale={dansModale}
      actionLibelle="Enregistrer"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field id="equipement-nom" label="Nom" requis erreur={erreurs.nom}>
        <input
          id="equipement-nom"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.nom ? true : undefined}
          className={controle(erreurs.nom)}
        />
      </Field>

      <Field
        id="equipement-serie"
        label="Numéro de série"
        requis
        erreur={erreurs.serie}
        aide="Ce qui distingue deux appareils identiques."
      >
        <input
          id="equipement-serie"
          type="text"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.serie ? true : undefined}
          className={controle(erreurs.serie)}
        />
      </Field>

      <Field id="equipement-type" label="Nature">
        <select
          id="equipement-type"
          value={type}
          onChange={(e) => setType(e.target.value as EquipmentType)}
          disabled={enCours}
          className={controle()}
        >
          {TYPES_EQUIPEMENT.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <Field id="equipement-lieu" label="Emplacement">
        <input
          id="equipement-lieu"
          type="text"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>

      <Field id="equipement-achat" label="Date d'achat">
        <input
          id="equipement-achat"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>

      <Field id="equipement-maintenance" label="Prochaine maintenance préventive">
        <input
          id="equipement-maintenance"
          type="date"
          value={maintenance}
          onChange={(e) => setMaintenance(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>

      <Field id="equipement-etalonnage" label="Prochain étalonnage">
        <input
          id="equipement-etalonnage"
          type="date"
          value={etalonnage}
          onChange={(e) => setEtalonnage(e.target.value)}
          disabled={enCours}
          className={controle()}
        />
      </Field>
    </FormShell>
  );
}
