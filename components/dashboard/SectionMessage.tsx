/**
 * Etat non-nominal d'une section de tableau de bord : chargement, erreur, ou absence de donnee.
 *
 * Les trois partagent volontairement la meme boite que PlaceholderSection : une section qui
 * charge, qui echoue ou qui est vide doit occuper la meme place que lorsqu'elle est remplie,
 * sans quoi la mise en page saute a chaque rafraichissement.
 */
export default function SectionMessage({
  variant,
  title,
  description,
}: {
  variant: "loading" | "error" | "empty";
  title: string;
  description?: string;
}) {
  const isError = variant === "error";

  return (
    <div
      // role="alert" sur la seule erreur : une annonce a chaque chargement rendrait la
      // navigation au lecteur d'ecran insupportable.
      role={isError ? "alert" : undefined}
      aria-busy={variant === "loading" || undefined}
      className={`flex min-h-[60vh] flex-col items-center justify-center rounded-lg border text-center ${
        isError
          ? "border-accent-200 bg-accent-50"
          : "border-dashed border-neutral-300 bg-white"
      }`}
    >
      <p
        className={`font-heading text-xl font-semibold ${
          isError ? "text-accent-700" : "text-secondary-500"
        }`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`mt-2 max-w-md px-6 text-sm ${
            isError ? "text-accent-700" : "text-neutral-500"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
