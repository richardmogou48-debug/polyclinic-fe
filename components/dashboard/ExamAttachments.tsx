"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import {
  fetchExamAttachments,
  ouvrirPieceExamen,
  tailleLisible,
  televerserPieceExamen,
  type ExamAttachment,
} from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Pieces jointes d'un examen : comptes rendus (PDF) et cliches (PNG, JPEG).
 *
 * `depot` ouvre le televersement — l'ecran du plateau technique le passe, le dossier medical en
 * lecture non. Le composant se rend invisible quand il n'y a rien a montrer et rien a deposer :
 * dans un dossier, une ligne « aucune piece » par examen serait du bruit.
 */
export default function ExamAttachments({
  examId,
  depot = false,
}: {
  examId: number;
  depot?: boolean;
}) {
  const router = useRouter();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [rafraichissements, setRafraichissements] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const pieces = useAuthenticatedResource<ExamAttachment[]>(
    (session) => fetchExamAttachments(examId, session.token),
    [examId, rafraichissements]
  );
  const liste = pieces.phase === "pret" ? pieces.donnees : [];

  // Le patient ou un role sans acces recoit un 403 : le composant se tait plutot que d'afficher
  // une erreur dans un ecran qui, lui, est legitime.
  if (!depot && (pieces.phase !== "pret" || liste.length === 0)) {
    return null;
  }

  const televerser = async (fichier: File) => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await televerserPieceExamen(examId, fichier, session.token);
      setRafraichissements((n) => n + 1);
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreur(attendu ? cause.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
      if (fichierRef.current) {
        fichierRef.current.value = "";
      }
    }
  };

  const ouvrir = async (piece: ExamAttachment) => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setErreur(null);
    try {
      await ouvrirPieceExamen(piece, session.token);
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        clearSession();
        router.replace("/login");
        return;
      }
      const attendu = cause instanceof ApiError;
      if (!attendu) console.error(cause);
      setErreur(attendu ? cause.message : "Une erreur inattendue est survenue.");
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2">
      {liste.length > 0 && (
        <ul className="flex flex-col gap-1">
          {liste.map((piece) => (
            <li key={piece.id}>
              <button
                type="button"
                onClick={() => void ouvrir(piece)}
                className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {piece.fileName ?? `Pièce ${piece.id}`}
              </button>
              <span className="ml-2 text-xs text-neutral-500">{tailleLisible(piece.sizeBytes)}</span>
            </li>
          ))}
        </ul>
      )}

      {depot && (
        <div>
          <label className="text-sm font-medium text-secondary-500">
            Joindre le compte rendu ou un cliché (PDF, PNG, JPEG — 20 Mo max)
            <input
              ref={fichierRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              disabled={enCours}
              onChange={(e) => {
                const fichier = e.target.files?.[0];
                if (fichier) void televerser(fichier);
              }}
              className="mt-1 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-500 hover:file:bg-neutral-100"
            />
          </label>
          {enCours && <p className="mt-1 text-xs text-neutral-500">Téléversement…</p>}
        </div>
      )}

      {erreur && (
        <p role="alert" className="text-xs font-medium text-accent-700">
          {erreur}
        </p>
      )}
    </div>
  );
}
