/**
 * Tuile de statistique.
 *
 * La valeur reste en encre et ne prend jamais la couleur d'un etat : c'est la mention textuelle
 * qui porte le sens. Une tuile ne doit pas se lire a la couleur seule — un lecteur daltonien, un
 * ecran en niveaux de gris ou un mode contraste force y perdraient l'information.
 */
export type TonStat = "neutre" | "attention" | "critique";

const TONS: Record<Exclude<TonStat, "neutre">, string> = {
  attention: "bg-tertiary-50 text-tertiary-700",
  critique: "bg-accent-50 text-accent-700",
};

export default function StatCard({
  label,
  value,
  hint,
  ton = "neutre",
  mention,
}: {
  label: string;
  value: string;
  hint?: string;
  ton?: TonStat;
  /** Mot qui accompagne le ton. Sans lui, le ton n'est pas rendu : pas de couleur seule. */
  mention?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-card">
      <p className="text-sm text-neutral-500">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className="font-heading text-3xl font-semibold tabular-nums text-secondary-500">{value}</p>
        {ton !== "neutre" && mention && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONS[ton]}`}>{mention}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
