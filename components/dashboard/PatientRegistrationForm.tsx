"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError, apiSend } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";

/**
 * Inscription d'un patient par l'accueil.
 *
 * Passe par POST /user/patients et non /user/register : cette route exige une identite
 * verifiee, et le backend y force le role PATIENT quoi que le corps contienne. C'est le chemin
 * prevu pour qu'un tiers inscrive quelqu'un, /register etant l'auto-inscription publique.
 *
 * La creation du compte declenche cote UserMS le provisionnement de la fiche dans ProfileMS :
 * il n'y a donc rien a saisir deux fois.
 */
type Erreurs = Partial<Record<"name" | "email" | "password", string>>;

/**
 * Validation cote client, en miroir des contraintes de UserDto.
 *
 * Elle ne remplace pas celle du backend — qui reste la seule qui fasse foi — mais elle evite un
 * aller-retour reseau pour dire ce qu'on sait deja, et rend le message en francais.
 */
function valider(name: string, email: string, password: string): Erreurs {
  const erreurs: Erreurs = {};
  if (!name.trim()) {
    erreurs.name = "Le nom est obligatoire.";
  }
  if (!email.trim()) {
    erreurs.email = "L'adresse email est obligatoire.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    erreurs.email = "Cette adresse email n'est pas valide.";
  }
  if (!password) {
    erreurs.password = "Un mot de passe provisoire est obligatoire.";
  } else if (password.length < 8) {
    // Le backend n'impose aucune longueur ; on ne cree pas un compte de sante a quatre
    // caracteres pour autant. Regle d'interface assumee, a durcir cote serveur.
    erreurs.password = "Le mot de passe doit faire au moins 8 caractères.";
  }
  return erreurs;
}

export default function PatientRegistrationForm({
  onEnregistre,
  dansModale = false,
}: {
  /** Appele apres une creation reussie, pour que les listes voisines se rechargent. */
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees = valider(name, email, password);
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) {
      return;
    }

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await apiSend("/user/patients", session.token, {
        corps: { name: name.trim(), email: email.trim(), password },
      });
      setSucces(`Patient enregistré : ${name.trim()}`);
      // Le formulaire est vide apres succes : a l'accueil, on enchaine les inscriptions, et
      // conserver les champs ferait risquer un doublon par re-soumission.
      setName("");
      setEmail("");
      setPassword("");
      onEnregistre?.();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) {
        console.error(cause);
      }
      setErreurGlobale(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <FormShell
      titre="Enregistrer un patient"
      description="Crée le compte et la fiche patient. Le mot de passe est provisoire : le patient devra en changer."
      dansModale={dansModale}
      actionLibelle="Enregistrer le patient"
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field id="nom" label="Nom complet" requis erreur={erreurs.name}>
        <input
          id="nom"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.name ? true : undefined}
          className={controle(erreurs.name)}
        />
      </Field>

      <Field id="email" label="Adresse email" requis erreur={erreurs.email}>
        <input
          id="email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.email ? true : undefined}
          className={controle(erreurs.email)}
        />
      </Field>

      <Field
        id="motdepasse"
        label="Mot de passe provisoire"
        requis
        erreur={erreurs.password}
        aide="Au moins 8 caractères. À communiquer au patient."
      >
        <input
          id="motdepasse"
          type="text"
          // Volontairement en clair : c'est l'agent d'accueil qui le choisit et le dicte au
          // patient. Le masquer l'obligerait a le saisir a l'aveugle puis a le relire ailleurs.
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={enCours}
          aria-invalid={erreurs.password ? true : undefined}
          className={controle(erreurs.password)}
        />
      </Field>

      <div className="sm:col-span-2">
        <p className="text-xs text-neutral-500">
          Les informations médicales (groupe sanguin, allergies, antécédents) se renseignent
          ensuite depuis le dossier du patient.
        </p>
      </div>
    </FormShell>
  );
}
