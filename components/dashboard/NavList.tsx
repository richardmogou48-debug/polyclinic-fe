"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { RoleConfig } from "@/lib/navigation";
import { clearSession } from "@/lib/auth";

/**
 * Liens de navigation et deconnexion, partages par la barre laterale et le tiroir mobile.
 *
 * Extrait pour que les deux ne divergent pas : un lien ajoute d'un cote et oublie de l'autre
 * donnerait un ecran atteignable au bureau et introuvable sur telephone, defaut qui ne se voit
 * qu'a l'usage et jamais a la relecture.
 */
export default function NavList({
  config,
  onNavigation,
}: {
  config: RoleConfig;
  /** Appele au clic sur un lien : le tiroir mobile s'en sert pour se refermer. */
  onNavigation?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const seDeconnecter = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {config.navItems.map((item) => {
          const actif = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigation}
              aria-current={actif ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                actif
                  ? "bg-primary-500/15 font-medium text-primary-300"
                  : "text-neutral-300 hover:bg-secondary-900 hover:text-neutral-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-secondary-200/10 px-3 py-4">
        <button
          type="button"
          onClick={seDeconnecter}
          className="block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-secondary-900 hover:text-accent-400"
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
