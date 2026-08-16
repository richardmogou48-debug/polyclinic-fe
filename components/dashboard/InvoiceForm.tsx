"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { fetchAppointmentsByPatient, type Appointment } from "@/lib/appointments";
import { ajouterLigne, montant, ouvrirFacture, type NouvelleLigne } from "@/lib/billing";
import {
  examCategoryLabel,
  fetchBillableExams,
  fetchBillableSurgeries,
  formatDateTime,
  type ExamBillingInfo,
  type SurgeryBillingInfo,
} from "@/lib/medicalRecords";
import { fetchMedicines, type Medicine } from "@/lib/pharmacy";
import { fetchAllPatients } from "@/lib/profiles";
import { fetchPatientStays, type PatientStay } from "@/lib/rooms";
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

  // Les actes du dossier du patient choisi, chacun dans sa vue de facturation. Ces listes ne
  // sont qu'une aide a la saisie : leur echec ne bloque pas la facture, il prive juste du
  // raccourci — d'ou l'absence de message d'erreur dedie.
  const examens = useAuthenticatedResource<ExamBillingInfo[]>(
    (session) =>
      patientId ? fetchBillableExams(Number(patientId), session.token) : Promise.resolve([]),
    [patientId]
  );
  const examensFacturables = examens.phase === "pret" ? examens.donnees : [];

  const interventions = useAuthenticatedResource<SurgeryBillingInfo[]>(
    (session) =>
      patientId ? fetchBillableSurgeries(Number(patientId), session.token) : Promise.resolve([]),
    [patientId]
  );
  const interventionsFacturables = interventions.phase === "pret" ? interventions.donnees : [];

  // Seuls les sejours termines sont proposables : RoomMS refuse de chiffrer un sejour en cours.
  const sejours = useAuthenticatedResource<PatientStay[]>(
    (session) =>
      patientId ? fetchPatientStays(Number(patientId), session.token) : Promise.resolve([]),
    [patientId]
  );
  const sejoursFacturables = (sejours.phase === "pret" ? sejours.donnees : []).filter(
    (sejour) => sejour.dischargeDate !== null
  );

  // Les rendez-vous d'examen sont ecartes : l'examen se facture par sa propre reference.
  const consultations = useAuthenticatedResource<Appointment[]>(
    (session) =>
      patientId ? fetchAppointmentsByPatient(Number(patientId), session.token) : Promise.resolve([]),
    [patientId]
  );
  const consultationsFacturables = (consultations.phase === "pret" ? consultations.donnees : []).filter(
    (rdv) => rdv.status !== "CANCELLED" && rdv.examRequestId === null
  );

  const medicaments = useAuthenticatedResource<Medicine[]>((session) => fetchMedicines(session.token));
  const listeMedicaments = medicaments.phase === "pret" ? medicaments.donnees : [];

  /**
   * Ajoute une ligne pre-remplie depuis un acte du dossier. Le prix propose reste modifiable —
   * la saisie garde le dernier mot, sauf pour le sejour dont RoomMS fait autorite et ecrase
   * prix et duree a l'enregistrement. Remplace l'unique ligne encore vierge plutot que de
   * laisser une ligne vide au-dessus.
   */
  const ajouterPreremplie = (ligne: Ligne) =>
    setLignes((actuelles) => {
      const [premiere] = actuelles;
      if (actuelles.length === 1 && !premiere.description.trim() && !premiere.unitPrice.trim()) {
        return [ligne];
      }
      return [...actuelles, ligne];
    });

  const ajouterExamen = (examen: ExamBillingInfo) =>
    ajouterPreremplie({
      description: examen.label ?? `Examen ${examen.id}`,
      unitPrice: examen.price !== null ? String(examen.price) : "",
      quantity: "1",
      sourceService: "MEDICAL_RECORD_MS",
      sourceReferenceId: examen.id,
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

        <div>
          <button
            type="button"
            onClick={() => setLignes((a) => [...a, { ...LIGNE_VIDE }])}
            disabled={enCours}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ajouter une ligne
          </button>
        </div>

        {/* Toutes les sources facturables du dossier : chaque choix ajoute une ligne referencee,
            que le backend verifie (patient, annulation, double facturation) et enrichit. */}
        <div className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ajouter depuis le dossier du patient
          </p>

          <Field id="facture-examen" label="Examen">
            <select
              id="facture-examen"
              value=""
              onChange={(e) => {
                const choisi = examensFacturables.find((x) => String(x.id) === e.target.value);
                if (choisi) ajouterExamen(choisi);
              }}
              disabled={enCours || !patientId || examensFacturables.length === 0}
              className={controle()}
            >
              <option value="">
                {!patientId
                  ? "Choisissez d'abord le patient"
                  : examensFacturables.length === 0
                    ? "Aucun examen"
                    : "Choisir…"}
              </option>
              {examensFacturables.map((examen) => (
                <option key={examen.id} value={examen.id}>
                  {(examen.label ?? `Examen ${examen.id}`) +
                    " — " +
                    examCategoryLabel(examen.category) +
                    " — " +
                    formatDateTime(examen.requestedAt, false) +
                    (examen.price !== null ? " — " + montant(examen.price) : "")}
                </option>
              ))}
            </select>
          </Field>

          <Field id="facture-intervention" label="Intervention (bloc opératoire)">
            <select
              id="facture-intervention"
              value=""
              onChange={(e) => {
                const choisie = interventionsFacturables.find((x) => String(x.id) === e.target.value);
                if (choisie) {
                  ajouterPreremplie({
                    description: choisie.procedureName ?? `Intervention ${choisie.id}`,
                    unitPrice: "",
                    quantity: "1",
                    sourceService: "SURGERY",
                    sourceReferenceId: choisie.id,
                  });
                }
              }}
              disabled={enCours || !patientId || interventionsFacturables.length === 0}
              className={controle()}
            >
              <option value="">
                {!patientId
                  ? "Choisissez d'abord le patient"
                  : interventionsFacturables.length === 0
                    ? "Aucune intervention"
                    : "Choisir…"}
              </option>
              {interventionsFacturables.map((intervention) => (
                <option key={intervention.id} value={intervention.id}>
                  {(intervention.procedureName ?? `Intervention ${intervention.id}`) +
                    " — " +
                    formatDateTime(intervention.scheduledDate, false)}
                </option>
              ))}
            </select>
          </Field>

          <Field id="facture-sejour" label="Hospitalisation (séjour terminé)">
            <select
              id="facture-sejour"
              value=""
              onChange={(e) => {
                const choisi = sejoursFacturables.find((x) => String(x.id) === e.target.value);
                if (choisi) {
                  // RoomMS fait autorite : prix par nuit et nombre de nuits seront ecrases a
                  // l'enregistrement, la ligne part donc a zero sans que cela ne compte.
                  ajouterPreremplie({
                    description: `Séjour hospitalier (séjour #${choisi.id})`,
                    unitPrice: "0",
                    quantity: "1",
                    sourceService: "ROOM_MS",
                    sourceReferenceId: choisi.id,
                  });
                }
              }}
              disabled={enCours || !patientId || sejoursFacturables.length === 0}
              className={controle()}
            >
              <option value="">
                {!patientId
                  ? "Choisissez d'abord le patient"
                  : sejoursFacturables.length === 0
                    ? "Aucun séjour terminé"
                    : "Choisir…"}
              </option>
              {sejoursFacturables.map((sejour) => (
                <option key={sejour.id} value={sejour.id}>
                  {`Séjour #${sejour.id} — du ${formatDateTime(sejour.admissionDate, false)} au ${formatDateTime(sejour.dischargeDate, false)}`}
                </option>
              ))}
            </select>
          </Field>

          <Field id="facture-consultation" label="Consultation">
            <select
              id="facture-consultation"
              value=""
              onChange={(e) => {
                const choisie = consultationsFacturables.find((x) => String(x.id) === e.target.value);
                if (choisie) {
                  ajouterPreremplie({
                    description: `Consultation médicale (rendez-vous #${choisie.id})`,
                    unitPrice: "",
                    quantity: "1",
                    sourceService: "APPOINTMENT",
                    sourceReferenceId: choisie.id,
                  });
                }
              }}
              disabled={enCours || !patientId || consultationsFacturables.length === 0}
              className={controle()}
            >
              <option value="">
                {!patientId
                  ? "Choisissez d'abord le patient"
                  : consultationsFacturables.length === 0
                    ? "Aucune consultation"
                    : "Choisir…"}
              </option>
              {consultationsFacturables.map((rdv) => (
                <option key={rdv.id} value={rdv.id}>
                  {formatDateTime(rdv.appointmentTime, false) + (rdv.reason ? ` — ${rdv.reason}` : "")}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field id="facture-medicament" label="Médicament (pharmacie)">
              <select
                id="facture-medicament"
                value=""
                onChange={(e) => {
                  const choisi = listeMedicaments.find((x) => String(x.id) === e.target.value);
                  if (choisi) {
                    ajouterPreremplie({
                      description: choisi.name ?? `Médicament ${choisi.id}`,
                      unitPrice: choisi.unitPrice !== null ? String(choisi.unitPrice) : "",
                      quantity: "1",
                      sourceService: "PHARMACY_MS",
                      sourceReferenceId: choisi.id,
                    });
                  }
                }}
                disabled={enCours || listeMedicaments.length === 0}
                className={controle()}
              >
                <option value="">
                  {listeMedicaments.length === 0 ? "Catalogue indisponible" : "Choisir…"}
                </option>
                {listeMedicaments.map((medicament) => (
                  <option key={medicament.id} value={medicament.id}>
                    {(medicament.name ?? `Médicament ${medicament.id}`) +
                      (medicament.dosage ? ` ${medicament.dosage}` : "") +
                      (medicament.unitPrice !== null ? " — " + montant(medicament.unitPrice) : "")}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>
    </FormShell>
  );
}
