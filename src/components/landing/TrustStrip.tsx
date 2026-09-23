"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// TRUST STRIP — Infinite marquee of organization types (CSS driven)
// =============================================================================

const CATEGORIES = [
  "NGOs",
  "Schools",
  "Associations",
  "Communities",
  "Nonprofits",
  "Businesses",
];

export default function TrustStrip() {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    // Respect reduced-motion: show everything immediately (marquee is frozen
    // by the global reduced-motion rule + motion-reduce classes).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  const items = (ariaHidden: boolean) => (
    <div className="flex items-center gap-x-4 md:gap-x-6" aria-hidden={ariaHidden || undefined}>
      {CATEGORIES.map((category, idx) => (
        <div key={category} className="flex items-center gap-4 md:gap-6">
          <span>{category}</span>
          {idx < CATEGORIES.length - 1 && (
            <span className="text-terracotta/60 text-[0.5rem]">●</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 md:py-16 border-b border-border overflow-hidden">
      <div
        ref={stripRef}
        className="section-container flex flex-col md:flex-row items-center justify-between gap-6 opacity-0"
      >
        <p className="text-ink font-medium text-center md:text-left md:whitespace-nowrap">
          Built for organizations collecting from many people.
        </p>

        <div className="w-full md:w-auto overflow-hidden">
          <div className="flex w-max animate-marquee gap-x-4 md:gap-x-6 motion-reduce:animate-none motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
            {items(false)}
            <div className="motion-reduce:hidden">{items(true)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}