import type { ReactNode } from "react";
import { Archivo } from "next/font/google";

/**
 * Les trois gabarits de CV sont composes en Archivo — leur signature typographique, distincte
 * de celle des documents de la polyclinique. Chargee ici seulement : les CV sont la seule
 * partie de l'application qui s'en sert.
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--police-cv",
});

export default function Layout({ children }: { children: ReactNode }) {
  return <div className={archivo.variable}>{children}</div>;
}
