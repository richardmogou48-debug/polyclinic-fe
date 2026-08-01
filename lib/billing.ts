// Facturation : appels et types, alignes sur les entites de BillingMS.
//
// Les montants sont des BigDecimal Java, serialises en nombres JSON. Ils sont donc soumis a la
// precision du double cote navigateur : suffisant pour l'affichage, a ne jamais utiliser pour
// recalculer un solde — c'est le backend qui fait foi (Invoice.getBalanceDue()).

import { apiGet, apiSend } from "@/lib/api";
import type { Role } from "@/lib/navigation";

export type InvoiceStatus = "DRAFT" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "CREDIT_CARD" | "MOBILE_MONEY" | "INSURANCE" | "BANK_TRANSFER";

export type InvoiceItem = {
  id: number;
  description: string | null;
  /** Service d'origine du poste : APPOINTMENT, ROOM_MS, PHARMACY_MS. */
  sourceService: string | null;
  sourceReferenceId: number | null;
  unitPrice: number | null;
  quantity: number | null;
  totalAmount: number | null;
};

export type Payment = {
  id: number;
  amount: number | null;
  paymentDate: string | null;
  paymentMethod: PaymentMethod | null;
  referenceNumber: string | null;
  cashierName: string | null;
};

export type Invoice = {
  id: number;
  patientId: number | null;
  issueDate: string | null;
  dueDate: string | null;
  status: InvoiceStatus | null;
  totalAmount: number | null;
  paidAmount: number | null;
  discountAmount: number | null;
  insuranceCoverageAmount: number | null;
  items: InvoiceItem[] | null;
  payments: Payment[] | null;
  /** Calcule par le backend, pas ici : total moins paye, remise et prise en charge. */
  balanceDue: number | null;
};

const STATUTS: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  UNPAID: "Impayée",
  PARTIALLY_PAID: "Partiellement réglée",
  PAID: "Réglée",
  CANCELLED: "Annulée",
};

const MOYENS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  CREDIT_CARD: "Carte bancaire",
  MOBILE_MONEY: "Mobile Money",
  INSURANCE: "Assurance",
  BANK_TRANSFER: "Virement",
};

export const invoiceStatusLabel = (v: string | null): string =>
  v ? (STATUTS[v as InvoiceStatus] ?? v) : "—";

export const paymentMethodLabel = (v: string | null): string =>
  v ? (MOYENS[v as PaymentMethod] ?? v) : "—";

/** Un solde restant du se lit en rouge, une facture soldee en neutre. */
export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  UNPAID: "bg-accent-50 text-accent-700",
  PARTIALLY_PAID: "bg-tertiary-50 text-tertiary-700",
  PAID: "bg-primary-50 text-primary-700",
  CANCELLED: "bg-neutral-100 text-neutral-600",
};

/**
 * Montant en francs CFA. Un montant absent rend un tiret, un montant a zero rend « 0 F CFA » :
 * sur une facture, ne pas avoir de remise et avoir une remise nulle se disent pareil, mais
 * n'avoir aucune information est autre chose.
 */
export function montant(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(valeur);
}

/**
 * Factures d'un patient.
 *
 * BillingAccessFilter n'ouvre cette route au role PATIENT que pour son propre identifiant ;
 * le personnel de facturation et la finance y accedent pour tout patient.
 */
export const fetchInvoicesByPatient = (patientId: number, token: string) =>
  apiGet<Invoice[]>(`/billing/invoice/patient/${patientId}`, token);

/** Toutes les factures, filtrables par statut. Ferme au role PATIENT. */
export const fetchInvoices = (token: string, status?: InvoiceStatus) =>
  apiGet<Invoice[]>(`/billing/invoice${status ? `?status=${status}` : ""}`, token);

/**
 * Roles autorises a ecrire en facturation, en miroir de BILLING_STAFF cote BillingAccessFilter.
 *
 * La finance en est absente alors qu'elle LIT tout : elle analyse, elle n'encaisse pas. C'est une
 * separation deliberee cote backend, pas un oubli de cablage.
 */
const FACTURIERS: ReadonlySet<Role> = new Set<Role>(["admin", "secretary"]);

export const peutFacturer = (role: Role): boolean => FACTURIERS.has(role);

/** Ouvre une facture vide pour un patient. Les lignes s'ajoutent ensuite. */
export const ouvrirFacture = (patientId: number, token: string) =>
  apiSend<Invoice>(`/billing/invoice/patient/${patientId}`, token, {});

export type NouvelleLigne = {
  description: string;
  unitPrice: number;
  quantity: number;
  /** Provenance de l'acte : « APPOINTMENT », « PHARMACY_MS »… Libre, non contraint par le backend. */
  sourceService?: string | null;
  sourceReferenceId?: number | null;
};

/**
 * Ajoute une ligne. Le total de la ligne et celui de la facture sont recalcules par le backend :
 * les envoyer d'ici laisserait deux verites possibles pour un montant.
 */
export const ajouterLigne = (invoiceId: number, ligne: NouvelleLigne, token: string) =>
  apiSend<Invoice>(`/billing/invoice/${invoiceId}/item`, token, { corps: ligne });

/**
 * Enregistre la part prise en charge par l'assurance.
 *
 * Le montant part en parametre de requete, pas dans un corps : c'est la signature du backend
 * (@RequestParam BigDecimal coverageAmount).
 */
export const appliquerAssurance = (invoiceId: number, montant: number, token: string) =>
  apiSend<Invoice>(`/billing/invoice/${invoiceId}/insurance?coverageAmount=${montant}`, token, {});

export type NouveauPaiement = {
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  cashierName?: string | null;
};

/** Encaisse un paiement. Le statut de la facture est recalcule par le backend. */
export const encaisser = (invoiceId: number, paiement: NouveauPaiement, token: string) =>
  apiSend<Payment>(`/billing/invoice/${invoiceId}/payment`, token, { corps: paiement });

/** Une facture reste vide tant qu'aucune ligne n'y figure : l'y ajouter est le geste suivant. */
export const MOYENS_DE_PAIEMENT = Object.entries(MOYENS) as [PaymentMethod, string][];
