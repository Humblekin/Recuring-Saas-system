"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// PRICING
// =============================================================================
// Design Note: Illustrative pricing only. Restrained design.
// =============================================================================

const PRICING_TIERS = [
  {
    name: "Starter",
    description: "For organizations just getting started with online collections.",
    price: "Free",
    period: "No monthly fee",
    features: [
      "1 Organization Profile",
      "Unlimited Payment Links",
      "Standard QR Code",
      "Email Support",
      "1.5% + GHS 1 per successful transaction (Illustrative)"
    ],
    cta: "Get Started",
    highlight: false
  },
  {
    name: "Growth",
    description: "For organizations running multiple campaigns and recurring schedules.",
    price: "GHS 150",
    period: "per month",
    features: [
      "Up to 3 Organization Profiles",
      "Dedicated Campaign Pages",
      "Custom Branded QR Codes",
      "Priority Support",
      "1% + GHS 1 per successful transaction (Illustrative)"
    ],
    cta: "Start Free Trial",
    highlight: true
  },
  {
    name: "Custom",
    description: "For large organizations with complex requirements and high volume.",
    price: "Custom",
    period: "tailored pricing",
    features: [
      "Unlimited Profiles & Campaigns",
      "API Access & Webhooks",
      "Custom Domain Integration",
      "Dedicated Account Manager",
      "Negotiated transaction rates"
    ],
    cta: "Contact Sales",
    highlight: false
  }
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          toggleActions: "play none none none",
        }
      }
    );
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="py-24 md:py-32 bg-cream">
      <div className="section-container">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-label mb-4 block">Simple Pricing</span>
          <h2 className="mb-4">Pay as you grow.</h2>
          <p className="text-body-lg text-ink-light">
            Start for free and only pay when you collect, or upgrade for advanced campaign tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <div 
              key={tier.name}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 opacity-0 ${
                tier.highlight 
                  ? "bg-surface border-2 border-ink shadow-card" 
                  : "bg-surface border border-border shadow-subtle hover:border-ink-muted"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink text-cream text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-medium mb-2">{tier.name}</h3>
                <p className="text-sm text-ink-muted h-10">{tier.description}</p>
              </div>

              <div className="mb-8 pb-8 border-b border-border">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display">{tier.price}</span>
                </div>
                <span className="text-sm text-ink-muted">{tier.period}</span>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-light">
                    <svg className="shrink-0 w-5 h-5 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className={`w-full py-3 rounded-xl font-medium transition-colors text-center no-underline block ${
                tier.highlight 
                  ? "bg-ink text-surface hover:bg-terracotta-dark" 
                  : "bg-cream border border-border text-ink hover:bg-border/50"
              }`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-muted mt-12 max-w-lg mx-auto">
          * Transaction fees shown are illustrative until commercial pricing is finalized. Standard payment gateway processing fees may apply.
        </p>

      </div>
    </section>
  );
}
