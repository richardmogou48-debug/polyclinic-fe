"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Dove from "@/components/brand/Dove";
import { ApiError, login } from "@/lib/api";
import { roleList } from "@/lib/navigation";
import { dashboardPathFor, saveSession, sessionFromToken, SessionError } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
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

    try {
      const session = sessionFromToken(await login(email, password));
      saveSession(session);
      router.push(dashboardPathFor(session.role));
    } catch (cause) {
      // ApiError et SessionError portent deja un message affichable ; tout le reste
      // est un bug inattendu qu'on ne veut pas exposer tel quel a l'utilisateur.
      const isExpected = cause instanceof ApiError || cause instanceof SessionError;
      setError(isExpected ? cause.message : "Une erreur inattendue est survenue.");
      if (!isExpected) {
        console.error(cause);
      }
      setIsSubmitting(false);
    }
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
        {/* Meme voile allege que l'accueil : overlay-dark montait a 88-92 % et
            masquait presque entierement la photo du batiment. */}
        <div className="absolute inset-0 bg-overlay-hero" />
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
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-tertiary-300">
            </p>
            <h2 className="mt-3 max-w-md font-heading text-3xl font-semibold text-white">
            </h2>
            <div className="mt-6 h-0.5 w-24 bg-brand-line" />
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

        {/* La colombe est posee derriere la carte et la deborde de tous les cotes : au centre
            elle se lit a travers la surface translucide, adoucie par le flou, et redevient
            nette sur les debords. Elle reste volontairement en dehors de la carte dans le DOM
            — un `backdrop-filter` ne floute que ce qui est derriere l'element, donc l'y placer
            supprimerait l'effet de verre depoli. Le `relative` de ce conteneur est ce qui
            l'ancre ; la carte, positionnee et plus loin dans le DOM, passe par-dessus sans
            avoir besoin de `z-index`.

            Le debord vertical dicte l'ecart avec le bloc de demonstration plus bas : a 210 %
            d'une carte d'environ 300 px, la colombe depasse de quelque 165 px de chaque cote.
            L'ecart retenu ne les separe pas tout a fait — les dernieres rectrices peuvent
            effleurer le cadre en pointilles — mais le degager entierement creusait un vide
            visible sous la carte. Le bloc de demonstration etant provisoire, le compromis
            tient jusqu'a son retrait. */}
        <div className="relative w-full max-w-sm">
          {/* Couche arriere : tout l'oiseau sauf le rameau, donc la queue derriere la carte.
              Le rameau doit en etre absent, et pas seulement recouvert : la couche avant le
              fait bouger, et la version au repos resterait visible dessous comme un fantome. */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
            {/* Teinte a pleine opacite : la carte n'en laisse passer qu'environ un quart, et
                le trait, une fois affine, disparaissait a toute valeur plus basse. */}
            <Dove portion="hors-rameau" className="h-[210%] w-auto text-primary-500" />
          </div>

          {/* Flou en valeur explicite : l'echelle nommee de Tailwind a change de sens entre
              la v3 et la v4, et au-dela de ~4 px le trace de la colombe s'efface. */}
          <div className="relative mt-18 overflow-hidden rounded-lg border border-neutral-200/80 bg-white/75 shadow-card backdrop-blur-[3px]">
            {/* Liseré aux couleurs du logo en tête de carte. */}
            <div className="h-1 bg-brand-line" />
            <div className="p-8">
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
                    className="w-full rounded-md border border-neutral-300 bg-white/70 px-3 py-2 text-sm outline-none transition-colors duration-250 ease-smooth focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                    className="w-full rounded-md border border-neutral-300 bg-white/70 px-3 py-2 text-sm outline-none transition-colors duration-250 ease-smooth focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="••••••••"
                  />
                </div>

                {/* role="alert" : l'echec de connexion doit etre annonce aux lecteurs
                    d'ecran, sans quoi il passe inapercu pour un utilisateur non voyant. */}
                {error && (
                  <p
                    role="alert"
                    className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-sm text-accent-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-250 ease-smooth hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </button>
              </form>
            </div>
          </div>

          {/* Couche avant : le meme dessin, aux memes dimensions et au meme endroit, reduit au
              rameau. Placee apres la carte dans le DOM, elle passe devant sans `z-index` — et
              c'est ce qui donne la profondeur : la queue derriere, la feuille devant, l'oiseau
              traverse la carte.

              Les deux couches doivent rester rigoureusement identiques de geometrie. Toute
              modification de taille ou d'alignement faite sur l'une doit l'etre sur l'autre,
              faute de quoi le rameau se decale du reste du dessin.

              `pointer-events-none` n'est pas cosmetique ici : cette couche recouvre les champs
              du formulaire, et sans elle le clic ne les atteindrait plus. */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
            <Dove portion="rameau" anime className="h-[210%] w-auto text-primary-500" />
          </div>
        </div>

        {/* ATTENTION : ces liens ouvrent les tableaux de bord sans authentification.
            Acceptable tant que les pages sont des maquettes sans donnee reelle, mais
            a retirer ou a conditionner avant la mise en service — voir README. */}
        {/* <div className="relative mt-32 w-full max-w-sm rounded-lg border border-dashed border-neutral-300 bg-neutral-100/60 p-4">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Aperçu des tableaux de bord — démonstration
          </p>
          <div className="grid grid-cols-3 gap-2">
            {roleList.map((role) => (
              <Link
                key={role.role}
                href={role.basePath}
                className="rounded-md border border-neutral-200 bg-white px-2 py-2 text-center text-xs text-neutral-600 transition-colors duration-250 ease-smooth hover:border-tertiary-300 hover:text-tertiary-600"
              >
                {role.label}
              </Link>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
