export default function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-center">
      <p className="font-heading text-xl font-semibold text-secondary-500">{title}</p>
      <p className="mt-2 max-w-md text-sm text-neutral-500">{description}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary-600">
        Section à venir
      </p>
    </div>
  );
}
