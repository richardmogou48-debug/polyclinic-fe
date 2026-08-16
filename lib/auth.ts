// Session utilisateur cote navigateur : decodage du JWT emis par UserMS et persistance locale.

import { roleConfigs, type Role } from "@/lib/navigation";

const STORAGE_KEY = "polyclinic.session";

// Correspondance avec UserMS/dto/Roles.java, dont les libelles du personnel sont alignes sur
// ProfileMS/dto/StaffRole.java — d'ou HR_STAFF, FINANCE_STAFF et QUALITY_MANAGER plutot que les
// noms courts utilises ici. Les neuf roles du frontend ont desormais tous un role backend ;
// toute valeur absente de cette table fait echouer sessionFromToken plus bas, ce qui est
// preferable a une redirection vers un espace arbitraire.
const ROLE_BY_BACKEND_NAME: Record<string, Role> = {
  PATIENT: "patient",
  ADMIN: "admin",
  DOCTOR: "doctor",
  SECRETARY: "secretary",
  NURSE: "nurse",
  PHARMACIST: "pharmacist",
  HR_STAFF: "hr",
  FINANCE_STAFF: "finance",
  QUALITY_MANAGER: "quality",
  LAB_TECHNICIAN: "labo",
  RADIOLOGIST: "imagerie",
};

export type Session = {
  token: string;
  userId: string | null;
  email: string;
  name: string;
  profileId: string | null;
  role: Role;
  /** Expiration en millisecondes (le claim `exp` du JWT est en secondes). */
  expiresAt: number;
};

// Claims produits par JwtUtil.generateToken (UserMS/jwt/JwtUtil.java).
type JwtClaims = {
  id?: number | string;
  email?: string;
  role?: string;
  name?: string;
  profileId?: number | string | null;
  sub?: string;
  exp?: number;
};

export class SessionError extends Error {}

const decodePayload = (token: string): JwtClaims => {
  const segment = token.split(".")[1];
  if (!segment) {
    throw new SessionError("Jeton d'authentification illisible.");
  }

  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    const binary = atob(padded);
    // Passage par TextDecoder plutot que atob seul : les noms contiennent des accents,
    // que le decodage latin-1 implicite de atob corromprait.
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
  } catch {
    throw new SessionError("Jeton d'authentification illisible.");
  }
};

const asOptionalString = (value: number | string | null | undefined): string | null =>
  value === null || value === undefined || value === "" ? null : String(value);

/** Construit la session a partir du JWT, ou echoue si le role n'a pas de dashboard associe. */
export function sessionFromToken(token: string): Session {
  const claims = decodePayload(token);
  const backendRole = claims.role?.toUpperCase() ?? "";
  const role = ROLE_BY_BACKEND_NAME[backendRole];

  if (!role) {
    throw new SessionError(
      `Aucun espace n'est disponible pour le role « ${claims.role ?? "inconnu"} ».`
    );
  }

  return {
    token,
    userId: asOptionalString(claims.id),
    email: claims.email ?? claims.sub ?? "",
    name: claims.name ?? "",
    profileId: asOptionalString(claims.profileId),
    role,
    expiresAt: claims.exp ? claims.exp * 1000 : 0,
  };
}

export const dashboardPathFor = (role: Role): string => roleConfigs[role].basePath;

export function saveSession(session: Session): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Session courante, ou null si absente, illisible ou expiree. */
export function readSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as Session;
    if (!session.token || !roleConfigs[session.role]) {
      clearSession();
      return null;
    }
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}
