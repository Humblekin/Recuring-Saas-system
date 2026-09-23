"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// FINAL CTA — Photographic closing section
// =============================================================================

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Respect reduced-motion: show content immediately, no parallax/animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(contentRef.current, { opacity: 1, y: 0 });
      return;
    }

    // Subtle parallax effect for the background image
    gsap.to(imageRef.current, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });

    // Content reveal
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          toggleActions: "play none none none",
        }
      }
    );
  }, []);

  return (
    <section id="get-started" ref={sectionRef} className="relative py-32 md:py-48 overflow-hidden bg-cream border-t border-border">

      {/* Background Photography with Parallax */}
      <div className="absolute inset-0 overflow-hidden bg-cream">
        <div
          ref={imageRef}
          className="absolute -inset-y-[12%] inset-x-0"
        >
          <Image
            src="/images/landing/celebration.jpg"
            alt="Team celebrating project completion"
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "50% 40%" }}
          />
        </div>
        {/* Flat dark overlay for text readability */}
        <div className="absolute inset-0 bg-[#050A08]/75"></div>
      </div>

      <div className="section-container relative z-10">
        <div
          ref={contentRef}
          className="max-w-3xl text-center mx-auto opacity-0"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-ink mb-6">
            Start collecting, properly.
          </h2>

          <p className="text-xl md:text-2xl text-ink-light mb-10 text-balance leading-relaxed">
            Give your organization one place to collect, manage, and understand every contribution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary w-full sm:w-auto text-lg py-4 px-8 inline-block text-center no-underline">
              Get Started
            </Link>
            <a href="#how-it-works" className="btn-secondary border-white/30 hover:border-white hover:bg-white/10 w-full sm:w-auto text-lg py-4 px-8">
              See How It Works
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
