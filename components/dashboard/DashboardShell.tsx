import type { ReactNode } from "react";
import type { RoleConfig } from "@/lib/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

/**
 * Ossature commune aux neuf tableaux de bord : barre laterale, et colonne de contenu.
 *
 * Le fond filigrane est pose ici et nulle part ailleurs — les neuf layouts de role passent tous
 * par ce composant, de sorte qu'il n'existe qu'un seul endroit ou le changer.
 *
 * Il est applique a la COLONNE de contenu et non a la page entiere : la barre laterale est
 * sombre, un motif clair y disparaitrait, et l'y faire passer couperait la colombe en deux au
 * niveau de la separation.
 *
 * `background-attachment` reste a sa valeur par defaut, donc le motif suit le defilement. Le
 * fixer donnerait l'impression d'un contenu qui glisse sur une image immobile, effet de vitrine
 * qui n'a pas sa place sur un outil de travail — et `fixed` se comporte mal sur mobile.
 */
export default function DashboardShell({
  config,
  children,
}: {
  config: RoleConfig;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar config={config} />
      <div
        className="flex flex-1 flex-col bg-neutral-50"
        style={{
          backgroundImage: "url('/background_dashboard.svg')",
          backgroundRepeat: "no-repeat",
          // Ancre en bas a droite, entierement dans le cadre : a cette taille, le debord qui
          // convenait a un grand motif n'en laisserait voir qu'un bout d'aile, illisible.
          backgroundPosition: "right 2.5rem bottom 2.5rem",
          // Un embleme discret plutot qu'un aplat : assez petit pour se lire d'un coup d'oeil
          // comme une colombe, et non comme une tache derriere le contenu.
          backgroundSize: "4.5rem auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
