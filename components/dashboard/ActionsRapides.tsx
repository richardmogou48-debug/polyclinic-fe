"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";

/**
 * Boutons d'action : une route, un geste, aucune saisie.
 *
 * Confirmer un rendez-vous, marquer une chambre nettoyee, demarrer une teleconsultation ne sont
 * pas des formulaires — les habiller en formulaires ajouterait une modale et un bouton d'envoi
 * pour un clic. Ce composant leur donne ce qui leur manque vraiment : un etat « en cours » qui
 * empeche le double clic, et un message d'erreur qui ne disparait pas tout seul.
 *
 * Le retour d'erreur est rendu par l'appelant, qui sait ou le placer dans sa liste.
 */
export function useAction(onFini?: () => void) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const executer = async (cle: string, action: (token: string) => Promise<unknown>) => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setErreur(null);
    setEnCours(cle);
    try {
      await action(session.token);
      onFini?.();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreur(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(null);
    }
  };

  return { executer, enCours, erreur };
}

/** Bouton discret, pour les actions listees a cote d'une ligne de tableau. */
export function BoutonLigne({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  /** Une action qui retire ou annule : elle se distingue avant le clic, pas apres. */
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-250 ease-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-accent-500 text-accent-700 hover:bg-accent-500 hover:text-white focus-visible:ring-accent-500"
          : "border-neutral-300 text-secondary-500 hover:bg-neutral-100 focus-visible:ring-primary-500"
      }`}
    >
      {children}
    </button>
  );
}
