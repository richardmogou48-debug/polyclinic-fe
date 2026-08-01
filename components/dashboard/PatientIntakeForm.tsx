"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError, apiSend } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { genererMotDePasse } from "@/lib/motDePasse";
import { GROUPES_SANGUINS, SEXES } from "@/lib/profiles";
import { enregistrerConstantes, nombreOuNull, peutReleverConstantes } from "@/lib/vitals";
import type { UserSummary } from "@/lib/users";

/**
 * Accueil d'un patient : compte, fiche et parametres, en une seule saisie.
 *
 * C'est le parcours reel — le patient arrive, l'infirmiere l'enregistre et prend ses constantes
 * dans la foulee. Les separer obligerait a retrouver le patient qu'on vient de creer, et le
 * medecin recevrait une consultation sans parametres.
 *
 * Ce composant n'est monte que lorsque la modale s'ouvre (voir Modal). Il peut donc s'initialiser
 * sur des valeurs propres au navigateur — la session, un tirage aleatoire — sans provoquer
 * d'ecart d'hydratation.
 */
type Erreurs = Partial<Record<"name" | "email" | "password" | "mesures", string>>;

// Les libelles viennent de lib/profiles : le formulaire propose exactement ce que les ecrans de
// lecture affichent. La chaine vide en tete n'existe qu'ici — « non connu » est un choix de
// saisie, pas une valeur de l'enumeration backend.
const GROUPES = [{ valeur: "", libelle: "Non connu" }, ...GROUPES_SANGUINS];

export default function PatientIntakeForm({
  onEnregistre,
  dansModale = false,
}: {
  onEnregistre?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [releveAutorise] = useState(() => {
    const session = readSession();
    return session ? peutReleverConstantes(session.role) : false;
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => genererMotDePasse());
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("UNKNOWN");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");

  const [tension, setTension] = useState("");
  const [pouls, setPouls] = useState("");
  const [temperature, setTemperature] = useState("");
  const [respiration, setRespiration] = useState("");
  const [saturation, setSaturation] = useState("");
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [motif, setMotif] = useState("");

  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [identifiants, setIdentifiants] = useState<{ email: string; motDePasse: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  const valider = (): Erreurs => {
    const trouvees: Erreurs = {};
    if (!name.trim()) trouvees.name = "Le nom est obligatoire.";
    // L'email est facultatif : le backend en genere un quand il manque. On ne valide sa forme
    // que s'il est renseigne.
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      trouvees.email = "Cette adresse email n'est pas valide.";
    }
    if (!password) {
      trouvees.password = "Un mot de passe provisoire est obligatoire.";
    } else if (password.length < 8) {
      trouvees.password = "Le mot de passe doit faire au moins 8 caractères.";
    }
    if (releveAutorise) {
      const mesures = [pouls, temperature, respiration, saturation, poids, taille];
      if (mesures.some((v) => nombreOuNull(v) === undefined)) {
        trouvees.mesures = "Les mesures doivent être des nombres.";
      }
    }
    return trouvees;
  };

  const reinitialiser = () => {
    setName("");
    setEmail("");
    // Nouveau tirage pour le patient suivant : reutiliser le precedent recreerait le secret
    // partage qu'on cherche justement a supprimer.
    setPassword(genererMotDePasse());
    setDob("");
    setGender("UNKNOWN");
    setPhone("");
    setAddress("");
    setBloodGroup("");
    setAllergies("");
    setTension("");
    setPouls("");
    setTemperature("");
    setRespiration("");
    setSaturation("");
    setPoids("");
    setTaille("");
    setMotif("");
  };

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);
    setIdentifiants(null);

    const trouvees = valider();
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
      const compte = await apiSend<UserSummary>("/user/patients", session.token, {
        corps: {
          name: name.trim(),
          email: email.trim() || null,
          password: motDePasseUtilise,
          dob: dob || null,
          gender,
          phone: phone.trim() || null,
          address: address.trim() || null,
          bloodGroup: bloodGroup || null,
          allergies: allergies.trim() || null,
        },
      });

      onEnregistre?.();

      // L'adresse retenue vient du serveur : c'est lui qui la genere quand elle manque, et
      // l'infirmiere doit pouvoir la dicter au patient.
      setIdentifiants({ email: compte?.email ?? email.trim(), motDePasse: motDePasseUtilise });

      const mesuresSaisies =
        releveAutorise &&
        [tension, pouls, temperature, respiration, saturation, poids, taille, motif].some((v) => v.trim());

      if (!mesuresSaisies) {
        setSucces(`Patient enregistré : ${name.trim()}`);
        reinitialiser();
        return;
      }

      if (!compte?.profileId) {
        setSucces(`Patient enregistré : ${name.trim()}`);
        setErreurGlobale("Les paramètres n'ont pas pu être enregistrés : aucune fiche patient n'a été créée.");
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
            weightKg: nombreOuNull(poids) ?? null,
            heightCm: nombreOuNull(taille) ?? null,
            additionalNotes: motif.trim() || null,
          },
          session.token
        );
        setSucces(`Patient enregistré et paramètres relevés : ${name.trim()}`);
        reinitialiser();
      } catch (cause) {
        // Le patient existe, le releve non : on le dit franchement plutot que de laisser croire
        // que tout est enregistre.
        const attendu = cause instanceof ApiError;
        setSucces(`Patient enregistré : ${name.trim()}`);
        setErreurGlobale(
          `Les paramètres n'ont pas été enregistrés (${
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
      if (!attendu) console.error(cause);
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
      {/* Identifiants a remettre au patient. C'est la seule occasion de les lire : le mot de
          passe n'est jamais restitue ensuite, seule son empreinte est conservee.
          D'ou le defilement : le bouton d'envoi est en bas du formulaire, ce bloc en haut, et
          sans lui l'infirmiere validait puis ne voyait jamais ce qu'elle doit dicter.
          Le ref de rappel se declenche au montage du bloc, c'est-a-dire exactement au moment ou
          les identifiants arrivent — pas besoin d'effet ni de dependance sur l'etat. */}
      {identifiants && (
        <div
          ref={(bloc) => bloc?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
          role="status"
          className="sm:col-span-2 rounded-md border border-primary-200 bg-primary-50 px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            À remettre au patient
          </p>
          <p className="mt-1 text-sm text-secondary-500">
            Identifiant : <code className="rounded bg-white px-1.5 py-0.5">{identifiants.email}</code>
          </p>
          <p className="mt-0.5 text-sm text-secondary-500">
            Mot de passe : <code className="rounded bg-white px-1.5 py-0.5">{identifiants.motDePasse}</code>
          </p>
        </div>
      )}

      <Field id="nom" label="Nom complet" requis erreur={erreurs.name}>
        <input id="nom" type="text" autoComplete="name" value={name}
          onChange={(e) => setName(e.target.value)} disabled={enCours}
          aria-invalid={erreurs.name ? true : undefined} className={controle(erreurs.name)} />
      </Field>

      <Field id="naissance" label="Date de naissance" aide="L'âge s'en déduit, il n'est pas saisi.">
        <input id="naissance" type="date" value={dob}
          onChange={(e) => setDob(e.target.value)} disabled={enCours} className={controle()} />
      </Field>

      <Field id="sexe" label="Sexe">
        <select id="sexe" value={gender} onChange={(e) => setGender(e.target.value)}
          disabled={enCours} className={controle()}>
          {SEXES.map((s) => <option key={s.valeur} value={s.valeur}>{s.libelle}</option>)}
        </select>
      </Field>

      <Field id="telephone" label="Téléphone">
        <input id="telephone" type="tel" autoComplete="tel" value={phone}
          onChange={(e) => setPhone(e.target.value)} disabled={enCours} className={controle()} />
      </Field>

      <Field id="adresse" label="Adresse">
        <input id="adresse" type="text" value={address}
          onChange={(e) => setAddress(e.target.value)} disabled={enCours} className={controle()} />
      </Field>

      <Field id="groupe" label="Groupe sanguin">
        <select id="groupe" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
          disabled={enCours} className={controle()}>
          {GROUPES.map((g) => <option key={g.valeur} value={g.valeur}>{g.libelle}</option>)}
        </select>
      </Field>

      <Field id="allergies" label="Allergies connues">
        <input id="allergies" type="text" value={allergies}
          onChange={(e) => setAllergies(e.target.value)} disabled={enCours} className={controle()} />
      </Field>

      <Field id="email" label="Adresse email" erreur={erreurs.email}
        aide="Facultative. Laissez vide : une adresse de connexion sera créée.">
        <input id="email" type="email" autoComplete="off" value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={enCours}
          aria-invalid={erreurs.email ? true : undefined} className={controle(erreurs.email)} />
      </Field>

      <Field id="motdepasse" label="Mot de passe provisoire" requis erreur={erreurs.password}
        aide="Tiré au hasard, prononçable. À dicter au patient.">
        <div className="flex gap-2">
          <input id="motdepasse" type="text" autoComplete="off" value={password}
            onChange={(e) => setPassword(e.target.value)} disabled={enCours}
            aria-invalid={erreurs.password ? true : undefined} className={controle(erreurs.password)} />
          <button type="button" onClick={() => setPassword(genererMotDePasse())} disabled={enCours}
            className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors duration-250 ease-smooth hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            Régénérer
          </button>
        </div>
      </Field>

      {releveAutorise && (
        <>
          <div className="sm:col-span-2 border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold text-secondary-500">Paramètres à l&apos;arrivée</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Facultatifs. Laissez vide ce qui n&apos;a pas été mesuré — un champ vide n&apos;est pas un zéro.
            </p>
            {erreurs.mesures && (
              <p role="alert" className="mt-1 text-xs font-medium text-accent-700">{erreurs.mesures}</p>
            )}
          </div>

          <Field id="tension" label="Tension artérielle" aide="Par exemple 120/80">
            <input id="tension" type="text" value={tension}
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

          <Field id="poids" label="Poids (kg)">
            <input id="poids" type="text" inputMode="decimal" value={poids}
              onChange={(e) => setPoids(e.target.value)} disabled={enCours} className={controle()} />
          </Field>

          <Field id="taille" label="Taille (cm)">
            <input id="taille" type="text" inputMode="decimal" value={taille}
              onChange={(e) => setTaille(e.target.value)} disabled={enCours} className={controle()} />
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
