"use client";

import { useParams } from "next/navigation";
import SectionMessage from "@/components/dashboard/SectionMessage";
import PrintShell, {
  CaseIdentite,
  ENCRE,
  Etiquette,
  FILET_LEGER,
  GRIS,
  GrilleIdentite,
  SARCELLE,
} from "@/components/print/PrintShell";
import {
  fetchAppointmentDetails,
  fetchAppointmentsByPatient,
  formatAppointmentTime,
  statusLabel,
  type Appointment,
} from "@/lib/appointments";
import { ETABLISSEMENT } from "@/components/print/PrintShell";
import { examCategoryLabel } from "@/lib/medicalRecords";
import { useAuthenticatedResource } from "@/lib/useAuthenticatedResource";

/**
 * Convocation de rendez-vous : le papier remis au patient quand son creneau est pris —
 * consultation chez un medecin, ou examen vers son plateau.
 *
 * Meme double voie d'acces que la facture : le personnel lit le rendez-vous par son numero
 * (route enrichie des noms), le patient retrouve le sien parmi ses rendez-vous via la route
 * verifiee — l'appartenance est garantie par le backend, pas par l'ecran.
 */
export default function Page() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = Number(params.appointmentId);

  const etat = useAuthenticatedResource<{ rdv: Appointment; nomPatient: string | null } | null>(
    async (session) => {
      if (session.role === "patient") {
        if (!session.profileId) {
          return null;
        }
        const siens = await fetchAppointmentsByPatient(Number(session.profileId), session.token);
        const rdv = siens.find((r) => r.id === appointmentId);
        // La route par patient ne renvoie pas son propre nom : la session le porte.
        return rdv ? { rdv, nomPatient: session.name || null } : null;
      }
      const rdv = await fetchAppointmentDetails(appointmentId, session.token);
      return { rdv, nomPatient: rdv.patientName };
    },
    [appointmentId]
  );

  if (etat.phase === "chargement") {
    return <SectionMessage variant="loading" title="Chargement de la convocation…" />;
  }
  if (etat.phase === "erreur" || etat.phase === "impossible") {
    return (
      <SectionMessage
        variant="error"
        title="Convocation indisponible"
        description={etat.phase === "erreur" ? etat.message : undefined}
      />
    );
  }

  const donnees = etat.donnees;
  if (donnees === null) {
    return (
      <SectionMessage
        variant="error"
        title="Convocation indisponible"
        description="Ce rendez-vous n'existe pas parmi les vôtres."
      />
    );
  }
  const { rdv, nomPatient } = donnees;

  const examen = rdv.examRequestId !== null;
  const annule = rdv.status === "CANCELLED";
  const objet = examen
    ? (rdv.examLabel ?? rdv.reason ?? "Examen")
    : rdv.doctorName
      ? `Consultation — ${rdv.doctorName}`
      : "Consultation médicale";

  return (
    <PrintShell
      titre="Convocation"
      numero={`N° RDV-${String(rdv.id).padStart(5, "0")}`}
      tag={statusLabel(rdv.status)}
      tonTag={annule ? "rouge" : rdv.status === "CONFIRMED" ? "sarcelle" : "contour"}
      sousTitre={examen ? "Laboratoire — Imagerie — Explorations" : "Consultations — Médecine générale"}
      note="En cas d'empêchement, merci de prévenir l'accueil au plus tôt : le créneau sera proposé à un autre patient."
      signature="Cachet — l'accueil"
    >
      <GrilleIdentite>
        <CaseIdentite
          premiere
          etiquette="Patient"
          principal={nomPatient ?? "—"}
          secondaire={`Fiche n° ${rdv.patientId ?? "—"}`}
        />
        <CaseIdentite
          etiquette="Objet"
          principal={objet}
          secondaire={examen ? examCategoryLabel(rdv.examCategory) : (rdv.reason ?? undefined)}
        />
        <CaseIdentite
          etiquette="Lieu"
          principal={examen ? "Plateau technique" : "Consultations"}
          secondaire="Se présenter à l'accueil"
        />
      </GrilleIdentite>

      {/* La date et l'heure sont l'information de ce document : elles s'affichent en grand. */}
      <div
        style={{
          position: "relative",
          marginTop: 24,
          padding: "18px 16px",
          background: annule ? "#F6F6F6" : SARCELLE,
          color: annule ? GRIS : "#ffffff",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          {annule ? "Rendez-vous annulé — initialement prévu le" : "Vous êtes attendu(e) le"}
        </div>
        <div
          style={{
            fontFamily: "var(--police-titres), Georgia, serif",
            fontWeight: 700,
            fontSize: 26,
            marginTop: 6,
            textDecoration: annule ? "line-through" : "none",
          }}
        >
          {formatAppointmentTime(rdv.appointmentTime)}
        </div>
      </div>

      {rdv.notes && (
        <div style={{ position: "relative", marginTop: 18 }}>
          <Etiquette>Notes</Etiquette>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: GRIS }}>{rdv.notes}</div>
        </div>
      )}

      <div style={{ position: "relative", marginTop: 22 }}>
        <div
          style={{
            fontFamily: "var(--police-titres), Georgia, serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            paddingBottom: 8,
            borderBottom: `2px solid ${ENCRE}`,
          }}
        >
          À prévoir
        </div>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: "11.5px", lineHeight: 1.9, color: GRIS }}>
          <li>Présentez-vous à l&apos;accueil 15 minutes avant l&apos;heure du rendez-vous.</li>
          <li>Munissez-vous d&apos;une pièce d&apos;identité et, le cas échéant, de votre carnet et de vos anciens résultats.</li>
          {examen && (
            <li style={{ borderBottom: `1px solid ${FILET_LEGER}`, paddingBottom: 8 }}>
              Certains examens exigent d&apos;être à jeun ou une préparation particulière : suivez les
              consignes données lors de la prescription, ou renseignez-vous au {ETABLISSEMENT.telephone.replace("Tél. ", "")}.
            </li>
          )}
        </ul>
      </div>
    </PrintShell>
  );
}
