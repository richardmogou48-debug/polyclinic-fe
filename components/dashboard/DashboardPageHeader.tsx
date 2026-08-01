export default function DashboardPageHeader({
  title,
  roleLabel,
}: {
  title: string;
  roleLabel: string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-4 sm:px-8 sm:py-5">
      <h1 className="font-heading text-2xl font-semibold text-secondary-500">{title}</h1>
      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
        {roleLabel}
      </span>
    </header>
  );
}
