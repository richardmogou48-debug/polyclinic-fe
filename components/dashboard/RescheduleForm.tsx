"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, controle } from "@/components/form/Field";
import FormShell from "@/components/form/FormShell";
import { ApiError, UnauthorizedError } from "@/lib/api";
import { clearSession, readSession } from "@/lib/auth";
import { formatAppointmentTime, reprogrammerRendezVous, versLocalDateTime } from "@/lib/appointments";
import type { Appointment } from "@/lib/appointments";

/**
 * Deplacement d'un rendez-vous.
 *
 * Separe de la planification bien que les deux ecrivent une date : reprogrammer part d'un
 * rendez-vous existant, dont le patient et le medecin ne changent pas. Les fondre dans un meme
 * formulaire donnerait l'impression qu'on peut aussi changer de medecin en deplacant l'horaire,
 * ce que la route ne fait pas.
 *
 * L'ancienne date reste affichee pendant la saisie : c'est ce dont on a besoin pour choisir la
 * nouvelle, et la faire disparaitre oblige a fermer pour la relire.
 */
export default function RescheduleForm({
  rendezVous,
  onReprogramme,
  dansModale = false,
}: {
  rendezVous: Appointment;
  onReprogramme?: () => void;
  dansModale?: boolean;
}) {
  const router = useRouter();

  const [quand, setQuand] = useState("");
  const [erreurDate, setErreurDate] = useState<string | undefined>();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreurGlobale(null);
    setSucces(null);

    if (!quand) {
      setErreurDate("Indiquez la nouvelle date et l'heure.");
      return;
    }
    setErreurDate(undefined);

    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setEnCours(true);
    try {
      await reprogrammerRendezVous(rendezVous.id, versLocalDateTime(quand), session.token);
      setSucces("Rendez-vous déplacé.");
      onReprogramme?.();
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
      titre="Déplacer le rendez-vous"
      dansModale={dansModale}
      actionLibelle="Déplacer"
      actionEnCours="Déplacement…"
      enCours={enCours}
      erreur={erreurGlobale}
      succes={succes}
      onSubmit={soumettre}
    >
      <div className="sm:col-span-2 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-sm text-secondary-500">
          {rendezVous.patientName ?? "Patient"} avec {rendezVous.doctorName ?? "le médecin"}
        </p>
        <p className="mt-0.5 text-sm text-neutral-500">
          Actuellement le {formatAppointmentTime(rendezVous.appointmentTime)}
        </p>
      </div>

      <div className="sm:col-span-2">
        <Field id="reprog-date" label="Nouvelle date et heure" requis erreur={erreurDate}>
          <input
            id="reprog-date"
            type="datetime-local"
            value={quand}
            onChange={(e) => setQuand(e.target.value)}
            disabled={enCours}
            aria-invalid={erreurDate ? true : undefined}
            className={controle(erreurDate)}
          />
        </Field>
      </div>
    </FormShell>
  );
}
