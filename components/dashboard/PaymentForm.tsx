"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  MOYENS_DE_PAIEMENT,
  appliquerAssurance,
  encaisser,
  montant as formaterMontant,
  type Invoice,
  type Payment,
  type PaymentMethod,
} from "@/lib/billing";

/**
 * Encaissement d'un paiement, et prise en charge par l'assurance.
 *
 * Les deux tiennent dans un ecran parce qu'ils repondent a la meme question — comment cette
 * facture est-elle soldee — et qu'a l'accueil on enregistre souvent les deux dans la foulee : la
 * part de l'assurance, puis le reste a charge.
 *
 * Aucun solde n'est recalcule ici. Le montant restant du est celui que le backend a etabli
 * (Invoice.getBalanceDue) ; le recalculer donnerait deux chiffres possibles pour une meme facture,
 * et l'ecart passerait pour une erreur de caisse.
 *
 * Le nom du caissier n'est pas saisi : il vient de la session. Le laisser en texte libre
 * permettrait d'encaisser au nom d'un collegue.
 */
export default function PaymentForm({
  facture,
  onEncaisse,
  dansModale = false,
}: {
  facture: Invoice;
  onEncaisse?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [montantSaisi, setMontantSaisi] = useState("");
  const [moyen, setMoyen] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [assurance, setAssurance] = useState("");

  const [erreurMontant, setErreurMontant] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  // Identifiant du reglement qui vient d'etre encaisse : c'est le moment ou le recu se remet.
  const [dernierReglement, setDernierReglement] = useState<number | null>(null);

  const nombreOuNull = (valeur: string): number | null => {
    const propre = valeur.trim().replace(",", ".");
    if (!propre) return null;
    const nombre = Number(propre);
    return Number.isFinite(nombre) && nombre > 0 ? nombre : null;
  };

  const executer = async (
    action: (token: string) => Promise<unknown>,
    message: string
  ): Promise<unknown> => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return undefined;
    }
    setErreurGlobale(null);
    setSucces(null);
    setEnCours(true);
    try {
      const resultat = await action(session.token);
      setSucces(message);
      onEncaisse?.();
      return resultat;
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

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const somme = nombreOuNull(montantSaisi);
    if (somme === null) {
      setErreurMontant("Indiquez un montant positif.");
      return;
    }
    setErreurMontant(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setDernierReglement(null);
    const paiement = (await executer(
      (token) =>
        encaisser(
          facture.id,
          {
            amount: somme,
            paymentMethod: moyen,
            referenceNumber: reference.trim() || null,
            cashierName: session.name || null,
          },
          token
        ),
      `Paiement de ${formaterMontant(somme)} enregistré.`
    )) as Payment | null | undefined;
    if (paiement && typeof paiement === "object" && "id" in paiement) {
      setDernierReglement(paiement.id);
    }
    setMontantSaisi("");
    setReference("");
  };

  const enregistrerAssurance = async () => {
    const somme = nombreOuNull(assurance);
    if (somme === null) {
      setErreurGlobale("Indiquez un montant de prise en charge positif.");
      return;
    }
    await executer(
      (token) => appliquerAssurance(facture.id, somme, token),
      `Prise en charge de ${formaterMontant(somme)} enregistrée.`
    );
    setAssurance("");
  };

  // Un moyen de paiement « assurance » saisi comme un encaissement ferait double emploi avec la
  // prise en charge, et gonflerait le montant paye. Le champ dedie est juste au-dessous.
  const moyenAssurance = moyen === "INSURANCE";

  return (
    <FormShell
      titre="Encaisser un paiement"
      dansModale={dansModale}
      actionLibelle="Enregistrer le paiement"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <div className="sm:col-span-2 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Facture n° {facture.id}
        </p>
        <p className="mt-1 text-sm text-secondary-500">
          Total {formaterMontant(facture.totalAmount)} · Déjà réglé{" "}
          {formaterMontant(facture.paidAmount)}
        </p>
        <p className="mt-0.5 text-sm font-medium text-secondary-500">
          Reste à payer {formaterMontant(facture.balanceDue)}
        </p>
        {dernierReglement !== null && (
          <p className="mt-2">
            <a
              href={`/print/recu/${facture.id}/${dernierReglement}`}
              target="_blank"
              rel="noopener"
              className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              Imprimer le reçu de caisse
            </a>
          </p>
        )}
      </div>

      <Field id="paiement-montant" label="Montant (FCFA)" requis erreur={erreurMontant}>
        <input
          id="paiement-montant"
          type="text"
          inputMode="numeric"
          value={montantSaisi}
          onChange={(e) => setMontantSaisi(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurMontant ? true : undefined}
          className={controle(erreurMontant)}
        />
      </Field>

      <Field
        id="paiement-moyen"
        label="Moyen"
        aide={moyenAssurance ? "Utilisez plutôt la prise en charge ci-dessous." : undefined}
      >
        <select
          id="paiement-moyen"
          value={moyen}
          onChange={(e) => setMoyen(e.target.value as PaymentMethod)}
          disabled={enCours}
          className={controle()}
        >
          {MOYENS_DE_PAIEMENT.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="paiement-reference"
          label="Référence"
          aide="Numéro de transaction Mobile Money, référence de virement…"
        >
          <input
            id="paiement-reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={enCours}
            className={controle()}
          />
        </Field>
      </div>

      {/* Hors du bouton d'envoi : c'est une autre ecriture, sur une autre route. */}
      <div className="sm:col-span-2 border-t border-neutral-200 pt-4">
        <Field
          id="assurance-montant"
          label="Prise en charge par l'assurance (FCFA)"
          aide="Enregistrée séparément du paiement : elle réduit le reste à charge, elle n'est pas encaissée."
        >
          <div className="flex gap-2">
            <input
              id="assurance-montant"
              type="text"
              inputMode="numeric"
              value={assurance}
              onChange={(e) => setAssurance(e.target.value)}
              disabled={enCours}
              className={controle()}
            />
            <button
              type="button"
              onClick={enregistrerAssurance}
              disabled={enCours}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </Field>
      </div>
    </FormShell>
  );
}
