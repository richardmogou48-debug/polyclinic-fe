// Comptes utilisateurs. Aligne sur UserMS/dto/UserSummary.
//
// UserSummary, et non UserDto : ce dernier porte le mot de passe cote backend. La liste ne le
// transporte donc pas, et ce type ne prevoit aucun champ pour l'accueillir.

import { apiGet } from "@/lib/api";

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
