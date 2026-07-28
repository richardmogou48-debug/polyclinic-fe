"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fait apparaitre son contenu en fondu montant lorsqu'il entre dans le champ de vision.
 *
 * Le contenu est rendu cote serveur dans le HTML (donc indexable), seule son opacite
 * est animee. Deux garde-fous l'accompagnent :
 * - une regle <noscript> dans app/page.tsx force la visibilite si JavaScript est
 *   indisponible, sinon la page apparaitrait vide ;
 * - une regle prefers-reduced-motion dans app/globals.css neutralise l'animation.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Decalage en ms, pour faire apparaitre une grille element par element. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Le reglage systeme "reduire les animations" est traite en CSS (app/globals.css),
    // pas ici : cela evite un etat intermediaire au premier rendu.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Une seule fois : reapparaitre a chaque passage serait fatigant a la lecture.
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
