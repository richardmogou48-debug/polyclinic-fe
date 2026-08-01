"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError, apiSend } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { enregistrerConstantes, nombreOuNull, peutReleverConstantes } from "@/lib/vitals";
import type { UserSummary } from "@/lib/users";

/**
 * Accueil d'un patient : enregistrement et releve des parametres, en une seule saisie.
 *
 * C'est le parcours reel — le patient arrive, on l'enregistre et on prend ses constantes dans
 * la foulee. Les separer en deux ecrans obligerait a retrouver le patient qu'on vient de creer,
 * et le medecin recevrait une consultation sans parametres.
 *
 * La section « parametres » n'apparait que pour un role autorise a relever des constantes.
 * MedicalRecordAccessFilter en exclut la secretaire, deliberement : prendre des parametres est
 * un geste de soin. Afficher des champs qui echoueraient a l'envoi serait pire que de ne pas
 * les afficher.
 *
 * L'enregistrement du patient et le releve sont DEUX appels, et le second peut echouer seul.
 * Ce cas est annonce explicitement plutot que masque : le patient existe, ses constantes non,
 * et l'utilisateur doit le savoir pour les ressaisir depuis le dossier.
 */
type Erreurs = Partial<Record<"name" | "email" | "password" | "constantes", string>>;

export default function PatientIntakeForm({
  onEnregistre,
  dansModale = false,
}: {
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  // localStorage n'existe pas cote serveur : lire la session pendant le rendu produisait une
  // erreur d'hydratation — le serveur rendait la variante « secretaire », le client celle de
  // l'infirmiere. Constate en console avant correction.
  //
  // useSyncExternalStore est l'API prevue pour exactement ce cas : une valeur qui differe entre
  // le serveur et le client, avec un instantane serveur explicite. Elle evite le setState dans
  // un effet, que React deconseille parce qu'il declenche un rendu en cascade.
  const releveAutorise = useSyncExternalStore(
    // Pas d'abonnement : le role ne change pas pendant la vie de la page.
    () => () => {},
    () => {
      const session = readSession();
      return session ? peutReleverConstantes(session.role) : false;
    },
    () => false
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tension, setTension] = useState("");
  const [pouls, setPouls] = useState("");
  const [temperature, setTemperature] = useState("");
  const [respiration, setRespiration] = useState("");
  const [saturation, setSaturation] = useState("");
  const [motif, setMotif] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const valider = (): Erreurs => {
    const trouvees: Erreurs = {};
    if (!name.trim()) trouvees.name = "Le nom est obligatoire.";
    if (!email.trim()) {
      trouvees.email = "L'adresse email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      trouvees.email = "Cette adresse email n'est pas valide.";
    }
    if (!password) {
      trouvees.password = "Un mot de passe provisoire est obligatoire.";
    } else if (password.length < 8) {
      trouvees.password = "Le mot de passe doit faire au moins 8 caractères.";
    }
    if (releveAutorise) {
      const numeriques = [pouls, temperature, respiration, saturation];
      if (numeriques.some((v) => nombreOuNull(v) === undefined)) {
        trouvees.constantes = "Les mesures doivent être des nombres.";
      }
    }
    return trouvees;
  };

  const reinitialiser = () => {
    setName("");
    setEmail("");
    setPassword("");
    setTension("");
    setPouls("");
    setTemperature("");
    setRespiration("");
    setSaturation("");
    setMotif("");
  };

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    const trouvees = valider();
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) {
      return;
    }

    const courante = readSession();
    if (!courante) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      const compte = await apiSend<UserSummary>("/user/patients", courante.token, {
        corps: { name: name.trim(), email: email.trim(), password },
      });

      // Le patient est cree ; a partir d'ici un echec ne doit plus faire croire a un echec
      // global. La liste est rechargee des maintenant.
      onEnregistre?.();

      const saisies =
        releveAutorise &&
        [tension, pouls, temperature, respiration, saturation, motif].some((v) => v.trim());

      if (!saisies) {
        setSucces(`Patient enregistré : ${name.trim()}`);
        reinitialiser();
        return;
      }

      // La fiche vient d'etre provisionnee par UserMS ; sans son identifiant, le releve ne peut
      // pas etre rattache.
      if (!compte?.profileId) {
        setSucces(`Patient enregistré : ${name.trim()}`);
        setErreurGlobale(
          "Les constantes n'ont pas pu être enregistrées : aucune fiche patient n'a été créée. Saisissez-les depuis le dossier."
        );
        reinitialiser();
        return;
      }

      try {
        await enregistrerConstantes(
          compte.profileId,
          {
            bloodPressure: tension.trim() || null,
            heartRate: nombreOuNull(pouls) ?? null,
            temperature: nombreOuNull(temperature) ?? null,
            respiratoryRate: nombreOuNull(respiration) ?? null,
            oxygenSaturation: nombreOuNull(saturation) ?? null,
            additionalNotes: motif.trim() || null,
          },
          courante.token
        );
        setSucces(`Patient enregistré et constantes relevées : ${name.trim()}`);
        reinitialiser();
      } catch (cause) {
        // Le patient existe, le releve non : on le dit franchement plutot que de laisser croire
        // que tout est enregistre.
        const attendu = cause instanceof ApiError;
        setSucces(`Patient enregistré : ${name.trim()}`);
        setErreurGlobale(
          `Les constantes n'ont pas été enregistrées (${
            attendu ? cause.message : "erreur inattendue"
          }). Saisissez-les depuis le dossier du patient.`
        );
        reinitialiser();
      }
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
      titre="Accueil d'un patient"
      description={
        releveAutorise
          ? "Enregistre le patient et relève ses paramètres. Le médecin les retrouvera dans son dossier."
          : "Enregistre le patient. Les paramètres seront relevés par le personnel soignant."
      }
      dansModale={dansModale}
      actionLibelle={releveAutorise ? "Enregistrer et relever" : "Enregistrer le patient"}
      actionEnCours="Enregistrement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <Field id="nom" label="Nom complet" requis erreur={erreurs.name}>
        <input id="nom" type="text" autoComplete="name" value={name}
          onChange={(e) => setName(e.target.value)} disabled={enCours}
          aria-invalid={erreurs.name ? true : undefined} className={controle(erreurs.name)} />
      </Field>

      <Field id="email" label="Adresse email" requis erreur={erreurs.email}>
        <input id="email" type="email" autoComplete="off" value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={enCours}
          aria-invalid={erreurs.email ? true : undefined} className={controle(erreurs.email)} />
      </Field>

      <Field id="motdepasse" label="Mot de passe provisoire" requis erreur={erreurs.password}
        aide="Au moins 8 caractères. À communiquer au patient.">
        <input id="motdepasse" type="text" autoComplete="off" value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={enCours}
          aria-invalid={erreurs.password ? true : undefined} className={controle(erreurs.password)} />
      </Field>

      {releveAutorise && (
        <>
          <div className="sm:col-span-2 border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold text-secondary-500">Paramètres à l&apos;arrivée</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Facultatifs. Laissez vide ce qui n&apos;a pas été mesuré — un champ vide n&apos;est pas un zéro.
            </p>
            {erreurs.constantes && (
              <p role="alert" className="mt-1 text-xs font-medium text-accent-700">{erreurs.constantes}</p>
            )}
          </div>

          <Field id="tension" label="Tension artérielle" aide="Par exemple 120/80">
            <input id="tension" type="text" inputMode="text" value={tension}
              onChange={(e) => setTension(e.target.value)} disabled={enCours} className={controle()} />
          </Field>

          <Field id="pouls" label="Pouls (bpm)">
            <input id="pouls" type="text" inputMode="decimal" value={pouls}
              onChange={(e) => setPouls(e.target.value)} disabled={enCours} className={controle()} />
          </Field>

          <Field id="temperature" label="Température (°C)">
            <input id="temperature" type="text" inputMode="decimal" value={temperature}
              onChange={(e) => setTemperature(e.target.value)} disabled={enCours} className={controle()} />
          </Field>

          <Field id="respiration" label="Fréquence respiratoire">
            <input id="respiration" type="text" inputMode="decimal" value={respiration}
              onChange={(e) => setRespiration(e.target.value)} disabled={enCours} className={controle()} />
          </Field>

          <Field id="saturation" label="Saturation (%)">
            <input id="saturation" type="text" inputMode="decimal" value={saturation}
              onChange={(e) => setSaturation(e.target.value)} disabled={enCours} className={controle()} />
          </Field>

          <Field id="motif" label="Motif de venue / observations">
            <input id="motif" type="text" value={motif}
              onChange={(e) => setMotif(e.target.value)} disabled={enCours} className={controle()} />
          </Field>
        </>
      )}
    </FormShell>
  );
}
