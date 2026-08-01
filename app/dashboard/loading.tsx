import Colombe from "@/components/Colombe";

/**
 * Chargement d'une page du tableau de bord.
 *
 * Next affiche ce fichier pendant que le composant serveur de la page se prepare. Rien ne le
 * couvrait jusqu'ici : la navigation restait sur l'ecran precedent, sans le moindre signe que
 * quelque chose se passait — et l'on cliquait une seconde fois.
 *
 * Il ne remplace pas les etats de chargement des sections, qui surviennent plus tard : celui-ci
 * concerne la page, ceux-la les donnees qu'elle va chercher depuis le navigateur.
 */
export default function Loading() {
  return (
    <div
      // aria-busy porte l'information ; la colombe est decorative et le texte l'accompagne.
      aria-busy="true"
      className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-6"
    >
      <Colombe />
      <p className="font-heading text-lg font-semibold text-secondary-500">Chargement…</p>
    </div>
  );
}
