// Client HTTP minimal vers la Gateway (port 9000 par defaut, cf. GatewayMs/application.properties).
// Les appels partent du navigateur : l'URL doit donc etre joignable depuis le poste du visiteur,
// pas seulement depuis le reseau Docker.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export class ApiError extends Error {}

// La Gateway serialise ses erreurs via ErrorInfo (UserMS/utility/ErrorInfo.java).
type ErrorInfo = {
  errorMessage?: string;
  errorCode?: number;
};

// Le backend renvoie ses messages en anglais depuis application.properties ; on traduit ceux
// qu'on sait rencontrer et on laisse passer les autres tels quels.
const MESSAGES_FR: Record<string, string> = {
  "Invalid Credentials": "Email ou mot de passe incorrect.",
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
