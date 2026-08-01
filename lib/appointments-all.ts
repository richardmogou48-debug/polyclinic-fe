// Liste globale des rendez-vous. Separee de lib/appointments.ts parce qu'elle n'obeit pas aux
// memes regles : les deux autres routes sont filtrees par appartenance, celle-ci est reservee
// au personnel de planification et ne porte aucun identifiant.

import { apiGet } from "@/lib/api";
import type { Appointment } from "@/lib/appointments";

/** Tous les rendez-vous de l'etablissement, les plus recents d'abord. */
export const fetchAllAppointments = (token: string) => apiGet<Appointment[]>("/appointment", token);
