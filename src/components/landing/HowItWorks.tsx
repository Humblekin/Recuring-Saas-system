"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// HOW IT WORKS — 6-Step Scroll-Driven Sequence
// =============================================================================

const STEPS = [
  {
    title: "Create your organization",
    description: "Set up your Kivaro account in minutes. Add your team, customize your branding, and connect your payout account.",
    visual: "organization"
  },
  {
    title: "Get your link & QR",
    description: "Kivaro automatically generates a universal payment link and downloadable QR code for your organization.",
    visual: "link"
  },
  {
    title: "Share with supporters",
    description: "Share the link on WhatsApp, social media, or your website. Print the QR code for events and physical locations.",
    visual: "share"
  },
  {
    title: "Supporters choose amount",
    description: "Your people land on a beautiful, mobile-optimized page where they can select how much they want to contribute.",
    visual: "amount"
  },
  {
    title: "One-time or recurring",
    description: "Supporters can make a single payment or easily authorize a recurring schedule (monthly, weekly) using their preferred payment method.",
    visual: "recurring"
  },
  {
    title: "Everything in one place",
    description: "Monitor contributions, track campaign progress, and manage recurring schedules from your real-time dashboard.",
    visual: "dashboard"
  }
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Respect reduced-motion: show all steps immediately (right visual stays static)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(stepRefs.current, { opacity: 1, y: 0 });
      gsap.set(headerRef.current, { opacity: 1, y: 0 });
      return;
    }

    // Section header reveal
    const headerTween = gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );

    // Only run on desktop where side-by-side makes sense for the visual column
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      // The visual column is pinned via CSS `sticky` (see render below),
      // so no GSAP pinning is needed — avoids jump/overlap with the next section.

      // Animate the progress line height based on scroll
      gsap.fromTo(
        progressLineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: leftColRef.current,
            start: "top 30%",
            end: "bottom 70%",
            scrub: true,
          }
        }
      );

      // Detect active step for updating the visual on the right
      stepRefs.current.forEach((step, i) => {
        if (!step) return;
        ScrollTrigger.create({
          trigger: step,
          start: "top 50%",
          end: "bottom 50%",
          onEnter: () => setActiveStep(i),
          onEnterBack: () => setActiveStep(i),
        });
      });
    });

    // Mobile fallback animations (fade in as scroll)
    mm.add("(max-width: 1023px)", () => {
       stepRefs.current.forEach((step) => {
        if (!step) return;
        gsap.fromTo(step, 
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6,
            scrollTrigger: {
              trigger: step,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );
       });
    });

    return () => {
      headerTween.kill();
      mm.revert(); // Clean up all ScrollTriggers on unmount
    };
  }, []);

  // Map step index to a specific visual component
  const renderVisual = (index: number) => {
    switch (STEPS[index].visual) {
      case "organization":
        return (
          <div className="w-full h-full relative overflow-hidden rounded-2xl bg-border">
            <Image
              src="/images/landing/team-meeting.jpg"
              alt="A team setting up their organization account"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 35%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A08]/85 via-[#050A08]/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 bg-surface/95 backdrop-blur rounded-xl border border-border p-3.5 shadow-product">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-md bg-terracotta flex items-center justify-center shrink-0">
                  <span className="font-display font-medium text-xs text-[#051009]">K</span>
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">HopeWorks Ghana</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-success">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Organization ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "link":
        return (
          <div className="w-full h-full bg-surface rounded-2xl shadow-card border border-border p-6 flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-cream rounded-xl border border-border shadow-sm">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                {/* Fake QR modules (painted under the finder squares) */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-[5px]">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className={`bg-ink rounded-[1px] ${i % 4 === 1 ? "opacity-20" : ""}`}></div>
                  ))}
                </div>
                {/* QR finder squares */}
                {[
                  "top-0 left-0",
                  "top-0 right-0",
                  "bottom-0 left-0",
                ].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-[38%] h-[38%] border-2 border-ink rounded-[3px]`}>
                    <div className="absolute inset-[28%] bg-ink rounded-[1px]"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full max-w-[300px] flex items-center justify-between gap-2 px-3 py-2.5 bg-cream rounded-lg border border-border">
              <span className="font-mono text-xs text-ink truncate">kivaro.app/pay/hopeworks</span>
              <span className="text-xs font-medium text-terracotta whitespace-nowrap">Copy</span>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
              Scan · Tap · Contribute
            </p>
          </div>
        );
      case "share":
        return (
          <div className="w-full h-full relative overflow-hidden rounded-2xl bg-border">
            <Image
              src="/images/landing/share.jpg"
              alt="People sharing a payment link"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>

            {/* WhatsApp-style share bubble */}
            <div className="absolute top-6 right-5 left-5 max-w-[240px] ml-auto bg-cream text-ink rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[12px] leading-snug shadow-product">
              <span className="font-medium">Help us finish the water project 💧</span>
              <span className="block mt-1 text-terracotta font-mono text-[11px] break-all">
                kivaro.app/pay/hopeworks
              </span>
            </div>

            <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 text-[11px] font-medium text-ink shadow-product">
              Link shared · WhatsApp, poster, socials
            </div>
          </div>
        );
      case "amount":
        return (
          <div className="w-full h-full relative overflow-hidden rounded-2xl bg-border">
            <Image
              src="/images/landing/campaign.jpg"
              alt="A supporter choosing an amount on their phone"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 40%" }}
            />
            <div className="absolute inset-0 bg-[#050A08]/35"></div>

            {/* Floating contribution card */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[240px] bg-surface/95 backdrop-blur rounded-2xl border border-border p-4 shadow-product">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-terracotta text-[#051009] flex items-center justify-center text-[10px] font-display font-medium shrink-0">
                  HW
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-ink truncate">HopeWorks Ghana</div>
                  <div className="text-[10px] text-ink-muted font-mono uppercase tracking-wider truncate">Community Project</div>
                </div>
              </div>

              <div className="text-[13px] font-medium text-ink mb-2.5">Choose your amount</div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {["GHS 50", "GHS 100", "GHS 500"].map((amount, i) => (
                  <div key={amount} className={`h-9 flex items-center justify-center rounded-lg font-mono text-[11px] border ${
                    i === 1 ? "bg-ink text-surface border-ink shadow-sm" : "bg-cream text-ink border-border"
                  }`}>
                    {amount}
                  </div>
                ))}
              </div>

              <div className="h-9 rounded-lg bg-terracotta flex items-center justify-center text-xs font-medium text-[#051009]">
                Contribute GHS 100
              </div>
            </div>
          </div>
        );
      case "recurring":
        return (
          <div className="w-full h-full bg-surface rounded-2xl shadow-card border border-border p-6 flex items-center justify-center">
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
                  </svg>
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">Auto-debit</span>
                </div>
                {/* Toggle ON */}
                <div className="relative w-10 h-6 rounded-full bg-terracotta">
                  <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-[#051009]"></div>
                </div>
              </div>

              <div className="bg-cream rounded-xl border border-border p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">Monthly</div>
                  <div className="text-xs text-ink-muted mt-0.5">GHS 100 · every 1st of the month</div>
                </div>
                <div className="font-mono text-sm text-ink">GHS 100</div>
              </div>

              <div className="flex gap-2">
                {[
                  { label: "Aug", done: true },
                  { label: "Sep", done: true },
                  { label: "Oct", done: false },
                ].map((m) => (
                  <div key={m.label} className={`flex-1 flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-mono ${
                    m.done ? "border-terracotta/40 bg-terracotta/10 text-terracotta" : "border-border bg-cream text-ink-muted"
                  }`}>
                    {m.done ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse"></span>
                    )}
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "dashboard":
        return (
          <div className="w-full h-full relative overflow-hidden rounded-2xl bg-border">
            <Image
              src="/images/landing/celebration.jpg"
              alt="A team reviewing campaign results in the Kivaro dashboard"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 45%" }}
            />
            <div className="absolute inset-0 bg-[#050A08]/45"></div>

            {/* Floating stat card */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[236px] bg-surface/95 backdrop-blur rounded-2xl border border-border p-4 shadow-product">
              <div className="text-[10px] uppercase tracking-widest font-mono text-ink-muted mb-1">Total collected</div>
              <div className="flex items-end justify-between">
                <div className="font-display text-2xl text-ink">GHS 42,500</div>
                <div className="badge badge-success">↑ 12%</div>
              </div>
              <svg className="mt-2 w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,15 L20,12 L40,14 L60,8 L80,9 L100,3" fill="none" stroke="var(--color-terracotta)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur border border-border rounded-xl px-3.5 py-2.5 text-[11px] text-ink shadow-product flex items-center justify-between">
              <span>142 recurring</span>
              <span className="text-ink-muted">·</span>
              <span>3 campaigns live</span>
              <span className="text-ink-muted">·</span>
              <span className="text-success">Live</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-cream">
      <div className="section-container" ref={containerRef}>
        
        <div className="mb-16 md:mb-24 max-w-2xl" ref={headerRef}>
          <span className="section-label mb-4 block">How it works</span>
          <h2>A seamless experience for you and your supporters.</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative">
          
          {/* --- Left Column: Steps (Scrolls) --- */}
          <div className="relative" ref={leftColRef}>
            
            {/* Progress Line Background (Desktop) */}
            <div className="hidden lg:block absolute left-[27px] top-4 bottom-4 w-[2px] bg-border z-0"></div>
            
            {/* Progress Line Active (Desktop) */}
            <div 
              ref={progressLineRef}
              className="hidden lg:block absolute left-[27px] top-4 bottom-4 w-[2px] bg-terracotta z-10 origin-top"
            ></div>

            <div className="flex flex-col gap-12 lg:gap-32 relative z-20">
              {STEPS.map((step, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col gap-5 rounded-2xl border border-border bg-surface shadow-sm p-5 lg:gap-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                  ref={(el) => { stepRefs.current[idx] = el; }}
                >
                  <div className="flex gap-4 sm:gap-6 lg:gap-10">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-mono text-sm border-2 transition-colors duration-500 bg-cream lg:bg-surface ${
                        activeStep >= idx ? "border-terracotta text-terracotta shadow-sm" : "border-border text-ink-muted"
                      }`}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="pt-3 min-w-0">
                      <h3 className="text-lg sm:text-xl mb-3 font-medium leading-snug">{step.title}</h3>
                      <p className="text-body text-balance">{step.description}</p>
                    </div>
                  </div>

                  {/* Mobile Visual (full-width below the step on small screens) */}
                  <div className="lg:hidden h-60 sm:h-64 relative rounded-2xl overflow-hidden">
                    {renderVisual(idx)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Right Column: Dynamic Visuals (Sticky on Desktop) --- */}
          <div className="hidden lg:block relative h-[600px] lg:sticky lg:top-24 lg:self-start lg:shrink-0">
            <div ref={rightColRef} className="absolute inset-0 w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full"
                >
                  {renderVisual(activeStep)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
