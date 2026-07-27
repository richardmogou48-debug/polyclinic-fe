"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { RoleConfig } from "@/lib/navigation";
import { clearSession } from "@/lib/auth";

export default function Sidebar({ config }: { config: RoleConfig }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-secondary-200/10 bg-secondary-950 text-neutral-50">
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {config.navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
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
          onClick={handleLogout}
          className="block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-secondary-900 hover:text-accent-400"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
