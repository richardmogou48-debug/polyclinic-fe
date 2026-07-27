import Image from "next/image";

export default function FeatureSection({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  tone?: "light" | "white";
}) {
  return (
    <section className={`px-6 py-16 sm:px-10 ${tone === "white" ? "bg-white" : "bg-neutral-50"}`}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className={`relative h-72 w-full overflow-hidden rounded-lg shadow-modal lg:h-96 ${reverse ? "lg:order-2" : ""}`}>
          <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
        </div>
        <div className={reverse ? "lg:order-1" : ""}>
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-secondary-500">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{description}</p>
        </div>
      </div>
    </section>
  );
}
