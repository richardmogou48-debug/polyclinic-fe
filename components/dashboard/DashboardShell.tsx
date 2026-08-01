import type { ReactNode } from "react";
import type { RoleConfig } from "@/lib/navigation";
import MobileNav from "@/components/dashboard/MobileNav";
import Sidebar from "@/components/dashboard/Sidebar";

/**
 * Ossature commune aux neuf tableaux de bord.
 *
 * Deux navigations coexistent, departagees par le seul CSS : la barre laterale a partir de « lg »,
 * le tiroir en dessous. Choisir en JavaScript supposerait de connaitre la largeur de l'ecran au
 * rendu serveur, ce qui n'est pas le cas — et produirait un ecart d'hydratation.
 *
 * Le fond filigrane est pose ici et nulle part ailleurs : les neuf layouts de role passent tous
 * par ce composant. Il est applique a la COLONNE de contenu et non a la page entiere — la barre
 * laterale est sombre, un motif clair y disparaitrait, et l'y faire passer couperait la colombe
 * au niveau de la separation.
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
        className="flex min-w-0 flex-1 flex-col bg-neutral-50"
        style={{
          backgroundImage: "url('/background_dashboard.svg')",
          backgroundRepeat: "no-repeat",
          // Ancre en bas a droite, entierement dans le cadre et hors de la zone de lecture.
          backgroundPosition: "right 2.5rem bottom 2.5rem",
          backgroundSize: "4.5rem auto",
        }}
      >
        <MobileNav config={config} />
        {children}
      </div>
    </div>
  );
}
