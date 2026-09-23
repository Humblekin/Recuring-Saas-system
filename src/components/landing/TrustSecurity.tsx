"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// TRUST & SECURITY
// =============================================================================
// Security Note: Accurate claims only. No fake compliance badges.
// =============================================================================

const TRUST_POINTS = [
  {
    title: "Secure infrastructure",
    description: "Kivaro is built on modern, secure cloud infrastructure to ensure your organization's data remains protected and available when you need it.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    )
  },
  {
    title: "Partner processing",
    description: "We partner with licensed mobile money operators like MTN Mobile Money to handle the actual financial transactions safely and securely.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    )
  },
  {
    title: "Data protection",
    description: "Your organization's dashboard and supporter data are protected using industry-standard security practices and modern encryption protocols.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    )
  }
];

export default function TrustSecurity() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Respect reduced-motion: show content immediately, no animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(cardsRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 75%",
          toggleActions: "play none none none",
        }
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-surface border-t border-border">
      <div className="section-container">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-label mb-4 block">Trust & Security</span>
          <h2 className="mb-6">Built for peace of mind.</h2>
          <p className="text-body-lg text-ink-light">
            We focus on the tools, and our payment partners focus on the processing.
            A clear, secure separation of concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRUST_POINTS.map((point, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="bg-cream border border-border p-8 rounded-2xl opacity-0"
            >
              <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta mb-6">
                {point.icon}
              </div>
              <h3 className="text-xl font-medium mb-3">{point.title}</h3>
              <p className="text-ink-light text-sm leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
