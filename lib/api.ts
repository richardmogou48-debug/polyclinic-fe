// Client HTTP minimal vers la Gateway (port 9000 par defaut, cf. GatewayMs/application.properties).
// Les appels partent du navigateur : l'URL doit donc etre joignable depuis le poste du visiteur,
// pas seulement depuis le reseau Docker.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export class ApiError extends Error {}

/**
 * Jeton absent, expire ou refuse par la Gateway. Distingue d'ApiError pour que l'appelant
 * puisse purger la session et renvoyer vers /login, plutot que d'afficher un message d'erreur
 * sur lequel l'utilisateur ne peut rien.
 */
export class UnauthorizedError extends ApiError {}

// La Gateway serialise ses erreurs via ErrorInfo (UserMS/utility/ErrorInfo.java).
type ErrorInfo = {
  errorMessage?: string;
  errorCode?: number;
};

// Le backend renvoie ses messages en anglais depuis application.properties ; on traduit ceux
// qu'on sait rencontrer et on laisse passer les autres tels quels.
const MESSAGES_FR: Record<string, string> = {
  "Invalid Credentials": "Email ou mot de passe incorrect.",
  "USER_ALREADY_EXISTS": "Un compte existe déjà avec cette adresse email.",
  " User Already Exists.": "Un compte existe déjà avec cette adresse email.",
  "PATIENT_ALREADY_EXISTS": "Ce patient est déjà enregistré.",
  "DOCTOR_NOT_FOUND": "Le médecin sélectionné est introuvable.",
  "PATIENT_NOT_FOUND": "Le patient sélectionné est introuvable.",
  "APPOINTMENT_NOT_MODIFIABLE": "Ce rendez-vous ne peut plus être modifié.",
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const raw = await response.text();

  try {
    const info = JSON.parse(raw) as ErrorInfo;
    const message = info.errorMessage?.trim();
    if (message) {
      return MESSAGES_FR[message] ?? message;
    }
  } catch {
    // Corps non-JSON (page d'erreur du proxy, timeout...) : on retombe sur le message generique.
  }

  return `Le serveur a repondu une erreur (HTTP ${response.status}).`;
};

/**
 * POST /user/login — route publique, exemptee du TokenFilter de la Gateway.
 * Renvoie le JWT brut : la reponse est du text/plain, pas du JSON.
 */
export async function login(email: string, password: string): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // fetch ne rejette que sur echec reseau : serveur injoignable, ou requete bloquee par CORS.
    throw new ApiError(
      `Impossible de contacter le serveur (${API_URL}). Verifiez que la Gateway est demarree.`
    );
  }

  if (!response.ok) {
    // Attention : une authentification invalide remonte en HTTP 500, pas 401 — le backend
    // mappe toutes les HmsException sur INTERNAL_SERVER_ERROR. On se fie donc au corps.
    throw new ApiError(await readErrorMessage(response));
  }

  const token = (await response.text()).trim();
  if (!token) {
    throw new ApiError("Le serveur n'a pas renvoye de jeton d'authentification.");
  }

  return token;
}

/**
 * Ecriture authentifiee : POST ou PUT.
 *
 * Renvoie le corps analyse quand il y en a un, `null` sinon — plusieurs routes du backend
 * repondent une chaine simple (« Appointment Cancelled ») ou rien du tout, et l'appelant n'a
 * en general que faire du retour : c'est le succes qui l'interesse.
 *
 * Le 403 est distingue du reste avec un message qui parle de droits. Attention toutefois :
 * ProfileMS, Appointment et PharmacyMS transforment encore leurs refus en 500 (leur
 * ExceptionControllerAdvice attrape Exception.class sans exclure ResponseStatusException), donc
 * un manque de droit peut y arriver deguise en erreur serveur. Corrige dans UserMS seulement.
 */
export async function apiSend<T = unknown>(
  path: string,
  token: string,
  options: { methode?: "POST" | "PUT"; corps?: unknown } = {}
): Promise<T | null> {
  const { methode = "POST", corps } = options;
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: methode,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  } catch {
    throw new ApiError(
      `Impossible de contacter le serveur (${API_URL}). Verifiez que la Gateway est demarree.`
    );
  }

  if (response.status === 401) {
    throw new UnauthorizedError("Votre session a expire. Veuillez vous reconnecter.");
  }
  if (response.status === 403) {
    throw new ApiError("Vous n'avez pas les droits necessaires pour cette action.");
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response));
  }

  const raw = (await response.text()).trim();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Reponse texte (« Appointment Cancelled ») : succes, mais rien a exploiter.
    return null;
  }
}

/**
 * GET authentifie sur la Gateway, qui renvoie du JSON.
 *
 * Le jeton part en `Authorization: Bearer` — c'est ce qu'attend GatewayMs/filter/TokenFilter,
 * qui le verifie puis relaie l'identite aux microservices via X-User-Role et X-Profile-Id. Ce
 * sont eux qui decident des autorisations fines : un 403 signifie donc que le role n'a pas le
 * droit sur cette ressource, pas que la session est invalide.
 */
export async function apiGet<T>(path: string, token: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(
      `Impossible de contacter le serveur (${API_URL}). Verifiez que la Gateway est demarree.`
    );
  }

  if (response.status === 401) {
    throw new UnauthorizedError("Votre session a expire. Veuillez vous reconnecter.");
  }

  if (response.status === 403) {
    throw new ApiError("Vous n'avez pas les droits necessaires pour consulter ces donnees.");
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response));
  }

  // Un corps vide est une reponse valide pour une collection absente cote backend ; on evite
  // que JSON.parse leve une erreur illisible en le traitant explicitement.
  const raw = (await response.text()).trim();
  if (!raw) {
    throw new ApiError("Le serveur a renvoye une reponse vide.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("Le serveur a renvoye une reponse illisible.");
  }
}
