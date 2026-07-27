export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-card">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-secondary-500">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
