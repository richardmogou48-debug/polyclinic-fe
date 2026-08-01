"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { genererMotDePasse } from "@/lib/motDePasse";
import { ROLES_PERSONNEL, creerMembre } from "@/lib/users";

/**
 * Creation d'un compte de personnel.
 *
 * C'est la seule route du systeme qui attribue un role autre que PATIENT, et elle est reservee a
 * l'administrateur — le backend le verifie sur l'en-tete d'identite reecrit par la Gateway, pas
 * sur ce que declare le client. Cet ecran est donc la porte unique par laquelle un privilege
 * entre dans l'etablissement.
 *
 * Le mot de passe est tire au hasard, comme a l'accueil des patients et pour la meme raison : un
 * mot de passe d'usine partage entre plusieurs comptes de personnel ouvrirait tous les tableaux
 * de bord a qui connait la convention. Il s'affiche apres creation pour etre remis a l'interesse
 * — c'est la seule occasion de le lire.
 */
type Erreurs = Partial<Record<"nom" | "email" | "motDePasse", string>>;

export default function StaffForm({
  onCree,
  dansModale = false,
}: {
  onCree?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => genererMotDePasse());
  const [role, setRole] = useState("NURSE");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [identifiants, setIdentifiants] = useState<{ email: string; motDePasse: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);
    setIdentifiants(null);

    const trouvees: Erreurs = {};
    if (!name.trim()) trouvees.nom = "Le nom est obligatoire.";
    // L'adresse est obligatoire ici, contrairement a l'accueil patient : elle sert d'identifiant
    // de connexion et le backend n'en genere pas pour le personnel.
    if (!email.trim()) {
      trouvees.email = "L'adresse email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      trouvees.email = "Cette adresse email n'est pas valide.";
    }
    if (!password || password.length < 8) {
      trouvees.motDePasse = "Le mot de passe doit faire au moins 8 caractères.";
    }
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const motDePasseUtilise = password;
    setEnCours(true);
    try {
      await creerMembre(
        { name: name.trim(), email: email.trim(), password: motDePasseUtilise, role },
        session.token
      );

      setSucces(`Compte créé : ${name.trim()}`);
      setIdentifiants({ email: email.trim(), motDePasse: motDePasseUtilise });
      setName("");
      setEmail("");
      // Nouveau tirage pour le compte suivant : reutiliser le precedent recreerait le secret
      // partage que le tirage sert justement a supprimer.
      setPassword(genererMotDePasse());
      onCree?.();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreurGlobale(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <FormShell
      titre="Créer un compte de personnel"
      description="Seul un administrateur peut attribuer un rôle. Le mot de passe est tiré au hasard."
      dansModale={dansModale}
      actionLibelle="Créer le compte"
      actionEnCours="Création…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      {identifiants && (
        <div
          ref={(bloc) => bloc?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
          role="status"
          className="sm:col-span-2 rounded-md border border-primary-200 bg-primary-50 px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            À remettre à l&apos;intéressé(e)
          </p>
          <p className="mt-1 text-sm text-secondary-500">
            Identifiant : <code className="rounded bg-white px-1.5 py-0.5">{identifiants.email}</code>
          </p>
          <p className="mt-0.5 text-sm text-secondary-500">
            Mot de passe :{" "}
            <code className="rounded bg-white px-1.5 py-0.5">{identifiants.motDePasse}</code>
          </p>
        </div>
      )}

      <Field id="staff-nom" label="Nom complet" requis erreur={erreurs.nom}>
        <input
          id="staff-nom"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.nom ? true : undefined}
          className={controle(erreurs.nom)}
        />
      </Field>

      <Field id="staff-role" label="Rôle">
        <select
          id="staff-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={enCours}
          className={controle()}
        >
          {ROLES_PERSONNEL.map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="staff-email"
          label="Adresse email"
          requis
          erreur={erreurs.email}
          aide="Sert d'identifiant de connexion."
        >
          <input
            id="staff-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurs.email ? true : undefined}
            className={controle(erreurs.email)}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field
          id="staff-motdepasse"
          label="Mot de passe provisoire"
          requis
          erreur={erreurs.motDePasse}
          aide="Tiré au hasard, prononçable. À dicter à l'intéressé(e)."
        >
          <div className="flex gap-2">
            <input
              id="staff-motdepasse"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={enCours}
              aria-invalid={erreurs.motDePasse ? true : undefined}
              className={controle(erreurs.motDePasse)}
            />
            <button
              type="button"
              onClick={() => setPassword(genererMotDePasse())}
              disabled={enCours}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-secondary-500 transition-colors duration-250 ease-smooth hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Régénérer
            </button>
          </div>
        </Field>
      </div>
    </FormShell>
  );
}
