"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession, type Session } from "@/lib/auth";

/**
 * Charge une ressource protegee depuis le navigateur.
 *
 * Le chargement ne peut pas se faire dans un composant serveur : le jeton vit dans localStorage,
 * auquel le serveur n'a pas acces. La doc Next suggere `use` + Suspense ou SWR, mais la premiere
 * suppose un fetch serveur et la seconde n'est pas dans les dependances du projet.
 *
 * Trois comportements sont mutualises ici parce qu'ils doivent etre identiques partout :
 * l'absence de session renvoie vers /login, un 401 purge la session avant d'y renvoyer, et une
 * erreur inattendue est journalisee sans exposer son message a l'utilisateur.
 */
export type Etat<T> =
  | { phase: "chargement" }
  | { phase: "erreur"; message: string }
  /** Le chargement n'a pas ete tente : la session ne portait pas ce qu'il fallait. */
  | { phase: "impossible" }
  | { phase: "pret"; donnees: T };

/**
 * @param charger recoit la session validee et rend la ressource. Rendre `null` signale que le
 *                chargement ne peut pas etre tente — typiquement un compte sans fiche
 *                ProfileMS, donc sans identifiant a interroger. L'etat passe alors a
 *                « impossible », que l'appelant rend avec son propre message : une liste vide
 *                laisserait croire a une absence de donnees.
 * @param deps    dependances supplementaires, comme pour useEffect.
 */
export function useAuthenticatedResource<T>(
  charger: (session: Session) => Promise<T> | null,
  deps: React.DependencyList = []
): Etat<T> {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat<T>>({ phase: "chargement" });

  useEffect(() => {
    // Evite d'ecrire dans un composant demonte si l'utilisateur quitte la page en cours de requete.
    let actif = true;

    const executer = async () => {
      const session = readSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const promesse = charger(session);
      if (promesse === null) {
        if (actif) {
          setEtat({ phase: "impossible" });
        }
        return;
      }

      try {
        const donnees = await promesse;
        if (actif) {
          setEtat({ phase: "pret", donnees });
        }
      } catch (cause) {
        if (!actif) {
          return;
        }
        if (cause instanceof UnauthorizedError) {
          clearSession();
          router.replace("/login");
          return;
        }
        const attendu = cause instanceof ApiError;
        if (!attendu) {
          console.error(cause);
        }
        setEtat({
          phase: "erreur",
          message: attendu ? cause.message : "Une erreur inattendue est survenue.",
        });
      }
    };

    void executer();
    return () => {
      actif = false;
    };
    // `charger` est volontairement hors des dependances : les appelants la definissent en ligne,
    // sa reference change a chaque rendu et la boucle serait infinie. Ce sont les `deps`
    // explicites qui pilotent le rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, ...deps]);

  return etat;
}
