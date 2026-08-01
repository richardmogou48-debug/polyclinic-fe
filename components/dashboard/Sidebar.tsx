import Image from "next/image";
import type { RoleConfig } from "@/lib/navigation";
import NavList from "@/components/dashboard/NavList";

/**
 * Barre laterale permanente, a partir de « lg » seulement.
 *
 * En dessous, elle est masquee au profit du tiroir de MobileNav : ses 16 rem fixes laissaient
 * 8 rem de contenu sur un telephone de 24 rem de large, ce qui rendait chaque tableau illisible.
 * Elle n'est pas retiree du DOM par une condition JavaScript mais par `hidden lg:flex` : le
 * serveur ne connait pas la largeur de l'ecran, et tout rendu conditionnel sur cette base
 * provoquerait un ecart d'hydratation.
 */
export default function Sidebar({ config }: { config: RoleConfig }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-secondary-200/10 bg-secondary-950 text-neutral-50 lg:flex">
      <div className="flex items-center gap-3 border-b border-secondary-200/10 px-5 py-5">
        <Image
          src="/logo_polyclinic.png"
          alt="Polyclinique Fultang"
          width={36}
          height={36}
          className="rounded-full"
        />
        <div className="leading-tight">
          <p className="font-heading text-sm font-semibold text-neutral-50">Polyclinique Fultang</p>
          <p className="text-xs text-neutral-400">{config.label}</p>
        </div>
      </div>

      <NavList config={config} />
    </aside>
  );
}
