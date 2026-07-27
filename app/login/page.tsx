"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { roleList } from "@/lib/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    setIsSubmitting(true);
    // TODO: brancher sur POST /user/login (Gateway) une fois l'API connectée.
    // Pour l'instant, la connexion réelle n'est pas encore implémentée.
    window.setTimeout(() => {
      setIsSubmitting(false);
      setError("La connexion n'est pas encore branchée au serveur. Utilisez l'aperçu ci-dessous.");
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-1">
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/polycinic.jpg"
          alt="Bâtiment de la Polyclinique Fultang"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo_polyclinic.png"
              alt="Polyclinique Fultang"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-heading text-xl font-semibold text-white">Polyclinique Fultang</span>
          </Link>
          <div>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              Santé pour tous — Health for all
            </p>
            <h2 className="mt-3 max-w-md font-heading text-3xl font-semibold text-white">
              Une prise en charge médicale moderne, humaine et accessible
            </h2>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-neutral-50 px-6 py-16 lg:w-1/2">
        <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
          <Image src="/logo_polyclinic.png" alt="Polyclinique Fultang" width={48} height={48} className="rounded-full" />
          <span className="font-heading text-xl font-semibold text-secondary-500">
            Polyclinique Fultang
          </span>
        </Link>

        <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-card">
          <h1 className="font-heading text-2xl font-semibold text-secondary-500">Connexion</h1>
          <p className="mt-1 text-sm text-neutral-500">Accédez à votre espace personnel.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-secondary-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-secondary-500">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-accent-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="mt-10 w-full max-w-sm">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
            Aperçu des tableaux de bord (développement)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {roleList.map((role) => (
              <Link
                key={role.role}
                href={role.basePath}
                className="rounded-md border border-neutral-200 bg-white px-2 py-2 text-center text-xs text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-600"
              >
                {role.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
