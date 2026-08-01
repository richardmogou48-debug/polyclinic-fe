// Releve de constantes. Ecriture vers MedicalRecordMS.

import { apiSend } from "@/lib/api";
import type { Role } from "@/lib/navigation";
import type { VitalSign } from "@/lib/medicalRecords";

/**
 * Roles autorises a relever des constantes, en miroir de VITALS_AUTHORS cote
 * MedicalRecordAccessFilter.
 *
 * La secretaire en est absente, et c'est un choix du backend commente comme tel : prendre des
 * parametres est un geste de soin. L'interface ne propose donc pas la saisie a qui ne peut pas
 * l'enregistrer — plutot que d'afficher des champs qui echoueraient a l'envoi.
 */
const RELEVEURS: ReadonlySet<Role> = new Set<Role>(["doctor", "admin", "nurse"]);

export const peutReleverConstantes = (role: Role): boolean => RELEVEURS.has(role);

export type ReleveConstantes = {
  bloodPressure?: string | null;
  /** Kilogrammes. BigDecimal cote backend : la valeur sert au calcul des posologies ponderales. */
  weightKg?: number | null;
  /** Centimetres. L'IMC se deduit de ces deux mesures, il n'est pas stocke. */
  heightCm?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  additionalNotes?: string | null;
};

/**
 * Enregistre un releve.
 *
 * `nurseId` n'est PAS transmis : le backend l'etablit depuis l'identite verifiee et ecrase ce
 * que porterait le corps. L'envoyer donnerait l'illusion que le client choisit l'auteur.
 */
export const enregistrerConstantes = (patientId: number, releve: ReleveConstantes, token: string) =>
  apiSend<VitalSign>(`/medicalrecord/patient/${patientId}/vitals`, token, { corps: releve });

/** Convertit une saisie en nombre, ou en null si le champ est vide. Une saisie invalide reste NaN. */
export const nombreOuNull = (valeur: string): number | null | undefined => {
  const propre = valeur.trim();
  if (!propre) {
    return null;
  }
  const nombre = Number(propre.replace(",", "."));
  return Number.isNaN(nombre) ? undefined : nombre;
};
