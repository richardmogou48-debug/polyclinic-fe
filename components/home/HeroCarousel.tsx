"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

const slides = ["/site1.jpg", "/site2.jpg", "/site3.jpg", "/acceuil1.jpg"];

export default function HeroCarousel({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden px-6 py-24 text-center sm:px-10">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <Image
            key={slide}
            src={slide}
            alt=""
            fill
            priority={index === 0}
            className={`object-cover transition-opacity duration-1000 ease-smooth ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-overlay-dark" />
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
