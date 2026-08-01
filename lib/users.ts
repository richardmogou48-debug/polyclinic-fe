// Comptes utilisateurs. Aligne sur UserMS/dto/UserSummary.
//
// UserSummary, et non UserDto : ce dernier porte le mot de passe cote backend. La liste ne le
// transporte donc pas, et ce type ne prevoit aucun champ pour l'accueillir.

import { apiGet, apiSend } from "@/lib/api";

export type UserSummary = {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  /** Fiche ProfileMS associee, ou null : l'administrateur n'en a pas. */
  profileId: number | null;
};

/**
 * Tous les comptes. Reservee a l'administrateur cote backend — c'est la seule vue qui rapproche
 * un email d'un role, donc la carte des privileges de l'etablissement.
 */
export const fetchUsers = (token: string) => apiGet<UserSummary[]>("/user", token);

/**
 * Roles attribuables a un compte de personnel, dans l'ordre de UserMS/dto/Roles.java.
 *
 * PATIENT en est absent : il a ses routes dediees, et l'ecarter ici empeche de creer un patient
 * par la porte du personnel, sans fiche ni dossier.
 *
 * ADMIN y figure mais ne recoit pas de fiche ProfileMS — il n'en existe pas d'equivalent cote
 * profils. Un administrateur ne peut donc pas signer d'acte clinique, et c'est voulu.
 */
export const ROLES_PERSONNEL: [string, string][] = [
  ["DOCTOR", "Médecin"],
  ["NURSE", "Infirmier(ère)"],
  ["SECRETARY", "Secrétaire"],
  ["PHARMACIST", "Pharmacien(ne)"],
  ["HR_STAFF", "Ressources humaines"],
  ["FINANCE_STAFF", "Finance"],
  ["QUALITY_MANAGER", "Responsable qualité"],
  ["ADMIN", "Administrateur"],
];

export type NouveauMembre = {
  name: string;
  email: string;
  password: string;
  role: string;
};

/**
 * Cree un compte de personnel.
 *
 * Reservee a l'administrateur : le backend verifie le role de l'appelant sur l'en-tete
 * X-User-Role, que la Gateway reecrit depuis le JWT — une valeur envoyee par le client est donc
 * ecrasee avant d'arriver. C'est la seule route qui attribue un role autre que PATIENT.
 */
export const creerMembre = (membre: NouveauMembre, token: string) =>
  apiSend("/user/staff", token, { corps: membre });
