"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// TRUST STRIP — Minimal, Editorial Context
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

  return (
    <section className="py-12 md:py-16 border-b border-border">
      <div 
        ref={stripRef}
        className="section-container flex flex-col md:flex-row items-center justify-between gap-6 opacity-0"
      >
        <p className="text-ink font-medium text-center md:text-left md:whitespace-nowrap">
          Built for organizations collecting from many people.
        </p>
        
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-4 md:gap-x-6 gap-y-2 text-ink-muted text-sm font-medium">
          {CATEGORIES.map((category, idx) => (
            <div key={category} className="flex items-center gap-4 md:gap-6">
              <span>{category}</span>
              {idx < CATEGORIES.length - 1 && (
                <span className="text-terracotta/60 text-[0.5rem]">●</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
