"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

const slides = [
  { src: "/site1.jpg", label: "Vue du batiment" },
  { src: "/site2.jpg", label: "Accueil de la polyclinique" },
  { src: "/site3.jpg", label: "Espaces de soin" },
  { src: "/acceuil1.jpg", label: "Consultation medicale" },
];

const SLIDE_DURATION = 5000;

export default function HeroCarousel({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden px-6 py-24 text-center sm:px-10">
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <Image
              key={slide.src}
              src={slide.src}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              // Le zoom Ken Burns est neutralise en mouvement reduit par une regle
              // prefers-reduced-motion dans app/globals.css.
              className={`object-cover transition-opacity duration-1000 ease-smooth ${
                isActive ? "animate-kenburns opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
        <div className="absolute inset-0 bg-overlay-hero" />
      </div>

      <div className="relative">{children}</div>

      {/* Indicateurs : sans eux, rien n'indique au visiteur que le hero est un
          carrousel — les photos changeaient sans aucune affordance. */}
      <div className="relative mt-14 flex items-center justify-center gap-3">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Afficher la photo ${index + 1} sur ${slides.length} : ${slide.label}`}
            aria-current={index === activeIndex}
            className={`h-1.5 rounded-full transition-all duration-350 ease-smooth ${
              index === activeIndex
                ? "w-10 bg-gold-400"
                : "w-4 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
