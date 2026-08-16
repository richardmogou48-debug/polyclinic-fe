"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { ajouterLigne, ouvrirFacture, type NouvelleLigne } from "@/lib/billing";
import {
  examCategoryLabel,
  fetchBillableExams,
  formatDateTime,
  type ExamBillingInfo,
} from "@/lib/medicalRecords";
import { fetchAllPatients } from "@/lib/profiles";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Ouverture d'une facture, avec ses premieres lignes.
 *
 * Le backend ouvre une facture VIDE puis accepte les lignes une par une : deux routes distinctes.
 * Les enchainer ici plutot que de laisser l'utilisateur ouvrir une facture puis la retrouver pour
 * la remplir evite l'etat le plus inutile du systeme — une facture a zero franc que personne ne
 * sait plus a quoi rattacher.
 *
 * Les montants ne sont jamais recalcules ici. Le total d'une ligne et celui de la facture sont
 * etablis par le backend ; les calculer aussi cote client creerait deux verites possibles pour un
 * meme montant, et c'est toujours celle affichee qui serait crue.
 */
type Ligne = {
  description: string;
  unitPrice: string;
  quantity: string;
  /** Presents quand la ligne vient d'un examen du patient : la reference part au backend, qui verifie et enrichit. */
  sourceService?: string;
  sourceReferenceId?: number;
};

const LIGNE_VIDE: Ligne = { description: "", unitPrice: "", quantity: "1" };

export default function InvoiceForm({
  onCreee,
  dansModale = false,
}: {
  onCreee?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([{ ...LIGNE_VIDE }]);

  const [erreurPatient, setErreurPatient] = useState<string | undefined>();
  const [erreurLignes, setErreurLignes] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const patients = useAuthenticatedResource((session) => fetchAllPatients(session.token));
  const listePatients = patients.phase === "pret" ? patients.donnees : [];

  // Les examens demandes au patient choisi, dans la vue pauvre de la facturation. La liste
  // n'est qu'une aide a la saisie : son echec ne bloque pas la facture, il prive juste du
  // raccourci — d'ou l'absence de message d'erreur dedie.
  const examens = useAuthenticatedResource<ExamBillingInfo[]>(
    (session) =>
      patientId ? fetchBillableExams(Number(patientId), session.token) : Promise.resolve([]),
    [patientId]
  );
  const examensFacturables = examens.phase === "pret" ? examens.donnees : [];

  /**
   * Ajoute une ligne pre-remplie depuis un examen : description et reference posees, prix a
   * saisir — aucune nomenclature tarifaire n'existe. Remplace l'unique ligne encore vierge
   * plutot que de laisser une ligne vide au-dessus.
   */
  const ajouterExamen = (examen: ExamBillingInfo) =>
    setLignes((actuelles) => {
      const ligne: Ligne = {
        description: examen.label ?? `Examen ${examen.id}`,
        unitPrice: "",
        quantity: "1",
        sourceService: "MEDICAL_RECORD_MS",
        sourceReferenceId: examen.id,
      };
      const [premiere] = actuelles;
      if (actuelles.length === 1 && !premiere.description.trim() && !premiere.unitPrice.trim()) {
        return [ligne];
      }
      return [...actuelles, ligne];
    });

  const modifier = (index: number, champ: keyof Ligne, valeur: string) =>
    setLignes((actuelles) =>
      actuelles.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne))
    );

  const retirerLigne = (index: number) =>
    setLignes((actuelles) => (actuelles.length === 1 ? actuelles : actuelles.filter((_, i) => i !== index)));

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    if (!patientId) {
      setErreurPatient("Choisissez le patient.");
      return;
    }
    setErreurPatient(undefined);

    const retenues = lignes.filter((l) => l.description.trim());
    const converties: NouvelleLigne[] = [];
    for (const ligne of retenues) {
      const prix = Number(ligne.unitPrice.replace(",", "."));
      const quantite = Number(ligne.quantity);
      if (!Number.isFinite(prix) || prix < 0 || !Number.isInteger(quantite) || quantite < 1) {
        setErreurLignes("Chaque ligne doit porter un prix positif et une quantité entière.");
        return;
      }
      converties.push({
        description: ligne.description.trim(),
        unitPrice: prix,
        quantity: quantite,
        // NOT NULL en base, et l'omettre faisait echouer l'ajout sur une violation de contrainte
        // rendue en erreur 500. La valeur dit la verite sur l'origine de la ligne : MANUAL pour
        // une saisie libre a l'accueil, MEDICAL_RECORD_MS quand la ligne reference un examen —
        // le backend verifie alors la reference (patient, non annule) et complete la description.
        sourceService: ligne.sourceService ?? "MANUAL",
        sourceReferenceId: ligne.sourceReferenceId ?? null,
      });
    }
    setErreurLignes(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      const facture = await ouvrirFacture(Number(patientId), session.token);
      if (!facture?.id) {
        setErreurGlobale(
          "La facture a été ouverte mais le serveur n'a pas renvoyé son identifiant : " +
            "les lignes n'ont pas pu y être ajoutées."
        );
        return;
      }

      // Les lignes partent une par une, en serie : le backend recalcule le total a chaque ajout,
      // et les envoyer en parallele ferait courir plusieurs recalculs sur la meme facture.
      for (const ligne of converties) {
        await ajouterLigne(facture.id, ligne, session.token);
      }

      setSucces(
        converties.length === 0
          ? `Facture n° ${facture.id} ouverte, sans ligne.`
          : `Facture n° ${facture.id} ouverte avec ${converties.length} ligne(s).`
      );
      setPatientId("");
      setLignes([{ ...LIGNE_VIDE }]);
      onCreee?.();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      // La facture peut exister alors qu'une ligne a echoue : le dire franchement, sinon on la
      // recreerait et le patient en aurait deux.
      setErreurGlobale(
        `${attendu ? cause.message : "Une erreur inattendue est survenue."} ` +
          "Vérifiez la liste des factures avant d'en ouvrir une autre."
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <FormShell
      titre="Ouvrir une facture"
      description="Les montants sont calculés par le serveur : seuls le prix unitaire et la quantité se saisissent."
      dansModale={dansModale}
      actionLibelle="Ouvrir la facture"
      actionEnCours="Création…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <div className="sm:col-span-2">
        <Field id="facture-patient" label="Patient" requis erreur={erreurPatient}>
          <select
            id="facture-patient"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurPatient ? true : undefined}
            className={controle(erreurPatient)}
          >
            <option value="">Choisir…</option>
            {listePatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name ?? `Patient ${patient.id}`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="sm:col-span-2 flex flex-col gap-3">
        {lignes.map((ligne, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[2fr_1fr_0.7fr_auto]"
          >
            <Field id={`ligne-desc-${index}`} label={index === 0 ? "Prestation" : ""}>
              <input
                id={`ligne-desc-${index}`}
                type="text"
                placeholder="Consultation généraliste"
                value={ligne.description}
                onChange={(e) => modifier(index, "description", e.target.value)}
                disabled={enCours}
                className={controle()}
              />
            </Field>

            <Field id={`ligne-prix-${index}`} label={index === 0 ? "Prix unitaire (FCFA)" : ""}>
              <input
                id={`ligne-prix-${index}`}
                type="text"
                inputMode="numeric"
                value={ligne.unitPrice}
                onChange={(e) => modifier(index, "unitPrice", e.target.value)}
                disabled={enCours}
                className={controle()}
              />
            </Field>

            <Field id={`ligne-qte-${index}`} label={index === 0 ? "Quantité" : ""}>
              <input
                id={`ligne-qte-${index}`}
                type="number"
                min={1}
                step={1}
                value={ligne.quantity}
                onChange={(e) => modifier(index, "quantity", e.target.value)}
                disabled={enCours}
                className={controle()}
              />
            </Field>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => retirerLigne(index)}
                disabled={enCours || lignes.length === 1}
                aria-label={`Retirer la ligne ${index + 1}`}
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

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={() => setLignes((a) => [...a, { ...LIGNE_VIDE }])}
            disabled={enCours}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ajouter une ligne
          </button>

          {examensFacturables.length > 0 && (
            <div className="min-w-56 flex-1">
              <Field id="facture-examen" label="Ou ajouter un examen demandé au patient">
                <select
                  id="facture-examen"
                  value=""
                  onChange={(e) => {
                    const choisi = examensFacturables.find(
                      (examen) => String(examen.id) === e.target.value
                    );
                    if (choisi) ajouterExamen(choisi);
                  }}
                  disabled={enCours}
                  className={controle()}
                >
                  <option value="">Choisir un examen…</option>
                  {examensFacturables.map((examen) => (
                    <option key={examen.id} value={examen.id}>
                      {(examen.label ?? `Examen ${examen.id}`) +
                        " — " +
                        examCategoryLabel(examen.category) +
                        " — " +
                        formatDateTime(examen.requestedAt, false)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      </div>
    </FormShell>
  );
}
