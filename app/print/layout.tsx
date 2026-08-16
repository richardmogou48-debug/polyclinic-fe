import type { ReactNode } from "react";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

/**
 * Layout des documents imprimables (/print/**).
 *
 * Charge les deux polices du theme graphique — Cormorant Garamond pour les titres, Montserrat
 * pour le corps — que tailwind.config.js declare mais que l'application ne chargeait pas : sur
 * un document remis au patient, la police de repli ne suffit pas. Chargees ici et non dans le
 * layout racine pour ne pas alourdir les ecrans, qui vivent tres bien en Geist.
 */
const titres = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--police-titres",
});

const corps = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--police-corps",
});

export default function Layout({ children }: { children: ReactNode }) {
  return <div className={`${titres.variable} ${corps.variable}`}>{children}</div>;
}
