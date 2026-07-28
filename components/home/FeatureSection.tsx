import Image from "next/image";
import Reveal from "@/components/home/Reveal";

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
      <div className="group mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal
          className={`relative h-72 w-full overflow-hidden rounded-lg shadow-modal lg:h-96 ${
            reverse ? "lg:order-2" : ""
          }`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            // Le zoom au survol s'applique depuis le conteneur de la section entiere :
            // survoler le texte anime aussi la photo, les deux se lisent comme un bloc.
            className="object-cover transition-transform duration-700 ease-smooth group-hover:scale-105"
          />
        </Reveal>

        <Reveal delay={120} className={reverse ? "lg:order-1" : ""}>
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-secondary-500">{title}</h2>
          <div className="mt-4 h-0.5 w-16 rounded-full bg-gold-line" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{description}</p>
        </Reveal>
      </div>
    </section>
  );
}
