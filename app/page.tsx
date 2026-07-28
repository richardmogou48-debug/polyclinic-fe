import Image from "next/image";
import Link from "next/link";
import FeatureSection from "@/components/home/FeatureSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import Reveal from "@/components/home/Reveal";

const featuredServices = [
  {
    eyebrow: "Consultations",
    title: "Des consultations adaptées à chaque besoin",
    description:
      "Médecine générale et spécialités : notre équipe de médecins vous accompagne à chaque étape, avec des rendez-vous simples à planifier et un suivi rigoureux de votre dossier.",
    imageSrc: "/acceuil1.jpg",
    imageAlt: "Consultation médicale à la Polyclinique Fultang",
  },
  {
    eyebrow: "Maternité",
    title: "Un accompagnement attentif pour la mère et l'enfant",
    description:
      "Suivi de grossesse, salle d'accouchement équipée et service de néonatologie : notre maternité prend en charge chaque étape avec douceur et rigueur médicale.",
    imageSrc: "/Maternite.jpg",
    imageAlt: "Service de maternité de la Polyclinique Fultang",
  },
  {
    eyebrow: "Bloc opératoire",
    title: "Un plateau chirurgical moderne et sécurisé",
    description:
      "Notre bloc opératoire dispose d'équipements modernes et d'une équipe chirurgicale expérimentée pour réaliser les interventions dans les meilleures conditions.",
    imageSrc: "/bloc-operatoire.jpg",
    imageAlt: "Bloc opératoire de la Polyclinique Fultang",
  },
  {
    eyebrow: "Imagerie médicale",
    title: "Des examens précis pour un diagnostic fiable",
    description:
      "Radiologie et imagerie médicale sur place, pour des diagnostics rapides et fiables qui accélèrent votre prise en charge.",
    imageSrc: "/imagerie_medicale1.jpg",
    imageAlt: "Service d'imagerie médicale de la Polyclinique Fultang",
  },
];

const moreServices = [
  { title: "Téléconsultation", description: "Consultez un médecin à distance, en toute sécurité." },
  { title: "Pharmacie", description: "Délivrance et suivi de vos prescriptions sur place." },
  { title: "Dentisterie", description: "Soins dentaires courants et spécialisés." },
  { title: "Rendez-vous en ligne", description: "Prenez rendez-vous en quelques clics, sans passer par le téléphone." },
  { title: "Dossier médical électronique", description: "Votre historique médical centralisé et accessible à votre équipe soignante." },
  { title: "Facturation & prise en charge", description: "Facturation claire et accompagnement pour les assurances." },
  { title: "Équipements médicaux", description: "Un plateau technique moderne, entretenu et régulièrement contrôlé." },
  { title: "Hygiène & sécurité sanitaire", description: "Protocoles stricts de nettoyage, désinfection et gestion des déchets." },
  { title: "Qualité & écoute patient", description: "Suivi des plaintes, audits internes et amélioration continue des soins." },
];

const reasons = [
  { title: "Équipe pluridisciplinaire", description: "Médecins, infirmiers, pharmaciens et personnel qualifié à votre écoute." },
  { title: "Plateforme unifiée", description: "Rendez-vous, dossier médical et facturation réunis en un seul endroit." },
  { title: "Accessibilité", description: "Consultations sur place ou à distance, selon vos besoins." },
  { title: "Exigence de qualité", description: "Des protocoles d'hygiène et de qualité suivis rigoureusement." },
];

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#a-propos", label: "À propos" },
  { href: "#contact", label: "Contact" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      {/* Sans JavaScript, les blocs animes resteraient a opacite 0 : la page
          apparaitrait vide. Cette regle les revele inconditionnellement. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Image src="/logo_polyclinic.png" alt="Polyclinique Fultang" width={44} height={44} className="rounded-full" />
          <span className="font-heading text-lg font-semibold text-secondary-500">
            Polyclinique Fultang
          </span>
        </div>
        <nav className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-primary-600"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          href="/login"
          className="rounded-md bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          Se connecter
        </Link>
      </header>

      <HeroCarousel>
        {/* Cette devise est ecrite en vert olive dans le logo : elle reprend donc
            sa couleur, eclaircie pour rester lisible sur les photos sombres. */}
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-tertiary-300">
          Santé pour tous — Health for all
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-semibold text-white sm:text-5xl">
          Une prise en charge médicale moderne, humaine et accessible
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-neutral-300">
          La Polyclinique Fultang réunit consultations, hospitalisation, pharmacie et téléconsultation
          sur une seule plateforme, pour vous et pour nos équipes soignantes.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-md bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-gold transition-colors hover:bg-primary-600"
          >
            Accéder à mon espace
          </Link>
          <a
            href="#services"
            className="rounded-md border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Découvrir nos services
          </a>
        </div>
      </HeroCarousel>

      <div id="services">
        <Reveal className="px-6 pt-20 text-center sm:px-10">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Nos services
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-semibold text-secondary-500">
            Tout ce dont vous avez besoin, réuni au même endroit
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-24 bg-brand-line" />
        </Reveal>

        {featuredServices.map((service, index) => (
          <FeatureSection
            key={service.title}
            {...service}
            reverse={index % 2 === 1}
            tone={index % 2 === 0 ? "light" : "white"}
          />
        ))}

        <div className="bg-neutral-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-center font-heading text-xl font-semibold text-secondary-500">
              Et aussi
            </h3>
            <div className="mx-auto mt-8 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreServices.map((service, index) => (
                // Le decalage suit la position dans la grille : les cartes se posent
                // l'une apres l'autre au lieu d'apparaitre toutes d'un bloc.
                <Reveal key={service.title} delay={(index % 3) * 90}>
                  <div className="group h-full rounded-lg border border-neutral-200 bg-white p-6 shadow-card transition-all duration-350 ease-smooth hover:-translate-y-1 hover:border-tertiary-300 hover:shadow-card">
                    {/* Le trait reste olive et s'allonge : la couleur dominante du logo
                        doit rester visible, pas ceder la place a la sarcelle au survol. */}
                    <div className="mb-4 h-1 w-10 rounded-full bg-tertiary-500 transition-all duration-350 ease-smooth group-hover:w-20" />
                    <h4 className="font-heading text-lg font-semibold text-secondary-500">{service.title}</h4>
                    <p className="mt-2 text-sm text-neutral-500">{service.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section id="a-propos" className="bg-white px-6 py-20 sm:px-10">
        <div className="group mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Reveal className="relative h-72 w-full overflow-hidden rounded-lg shadow-modal lg:h-96">
            <Image
              src="/polycinic.jpg"
              alt="Bâtiment de la Polyclinique Fultang"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-smooth group-hover:scale-105"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
              À propos de nous
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-secondary-500">
              Un établissement moderne au service de votre santé
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              La Polyclinique Fultang accompagne les patients à chaque étape de leur parcours de soin :
              consultation, hospitalisation, pharmacie et suivi médical. Notre équipe pluridisciplinaire
              s&apos;appuie sur une plateforme numérique pour offrir un service rapide, transparent et
              humain.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {reasons.map((reason, index) => (
                // Alternance sarcelle / olive : les deux couleurs du logo se repondent
                // au lieu qu'une seule occupe tout l'espace.
                <div
                  key={reason.title}
                  className={`border-l-2 border-neutral-200 pl-4 transition-colors duration-350 ease-smooth ${
                    index % 2 === 0 ? "hover:border-primary-500" : "hover:border-tertiary-500"
                  }`}
                >
                  <h3 className="font-heading text-base font-semibold text-secondary-500">
                    {reason.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">{reason.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative bg-dark-gradient px-6 py-16 text-center sm:px-10">
        {/* Filet aux couleurs du logo en tete de bandeau : rappelle la charte au
            moment ou l'on demande l'action principale. */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-line" />
        <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
          Prêt à prendre rendez-vous ?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-300">
          Connectez-vous à votre espace personnel pour gérer vos rendez-vous, votre dossier médical et
          vos factures.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-gold transition-colors hover:bg-primary-600"
        >
          Accéder à mon espace
        </Link>
      </section>

      <footer id="contact" className="mt-auto border-t border-neutral-200 bg-white px-6 py-10 text-sm sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/logo_polyclinic.png" alt="Polyclinique Fultang" width={36} height={36} className="rounded-full" />
            <span className="font-heading font-semibold text-secondary-500">Polyclinique Fultang</span>
          </div>
          <div className="text-neutral-500">
            <p>Fultang, Cameroun</p>
            <p>contact@polycliniquefultang.cm</p>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} Polyclinique Fultang — Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
