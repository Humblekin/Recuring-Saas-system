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
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Respect reduced-motion: show all steps immediately (right visual stays static)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(stepRefs.current, { opacity: 1, y: 0 });
      return;
    }

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

    return () => mm.revert(); // Clean up all ScrollTriggers on unmount
  }, []);

  // Map step index to a specific visual component
  const renderVisual = (index: number) => {
    switch (STEPS[index].visual) {
      case "organization":
        return (
          <div className="w-full h-full bg-surface rounded-2xl shadow-card border border-border p-6 flex flex-col justify-center gap-4">
             <div className="w-16 h-16 bg-cream rounded-lg border border-border shadow-sm flex items-center justify-center text-terracotta font-display text-2xl">
               HW
             </div>
             <div className="h-6 w-3/4 bg-border/60 rounded-md"></div>
             <div className="h-4 w-1/2 bg-border/40 rounded-md"></div>
          </div>
        );
      case "link":
        return (
          <div className="w-full h-full bg-surface rounded-2xl shadow-card border border-border p-6 flex flex-col items-center justify-center gap-4">
             <div className="p-3 bg-cream rounded-xl border border-border">
               {/* Mock QR Code Pattern */}
               <div className="w-24 h-24 sm:w-28 sm:h-28 grid grid-cols-4 grid-rows-4 gap-1 opacity-80">
                 {Array.from({length: 16}).map((_, i) => (
                   <div key={i} className={`bg-ink rounded-sm ${i%3===0 ? 'opacity-20' : ''}`}></div>
                 ))}
               </div>
             </div>
             <div className="w-full bg-cream p-2.5 rounded-md border border-border text-center font-mono text-xs sm:text-sm text-ink break-all">
                kivaro.app/pay/hopeworks
             </div>
          </div>
        );
      case "share":
        return (
          <div className="w-full h-full rounded-2xl overflow-hidden relative bg-border">
            <Image 
              src="/images/landing/share.jpg" 
              alt="People sharing information" 
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        );
      case "amount":
        return (
          <div className="w-full h-full bg-surface rounded-2xl shadow-card border border-border p-5 sm:p-6 flex items-center justify-center">
             <div className="w-full max-w-[260px] space-y-2.5">
               <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-full bg-cream border border-border flex items-center justify-center text-[10px] font-display font-medium text-terracotta shrink-0">
                   HW
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-xs font-medium text-ink truncate">HopeWorks Ghana</div>
                   <div className="text-[10px] text-ink-muted font-mono uppercase tracking-wider truncate">Community Project</div>
                 </div>
               </div>

               <div className="text-sm font-medium text-ink pt-1">Choose your amount</div>

               <div className="grid grid-cols-3 gap-2">
                 {["GHS 50", "GHS 100", "GHS 500"].map((amount, i) => (
                   <div key={amount} className={`h-9 flex items-center justify-center rounded-lg font-mono text-[11px] border ${
                     i === 1 ? "bg-ink text-surface border-ink shadow-sm" : "bg-cream text-ink border-border"
                   }`}>
                     {amount}
                   </div>
                 ))}
               </div>

               <div className="flex p-1 bg-cream rounded-lg border border-border">
                 <div className="flex-1 text-center text-[10px] font-medium text-ink-muted py-1">One-time</div>
                 <div className="flex-1 text-center text-[10px] font-medium text-ink py-1 bg-surface rounded-md shadow-sm border border-border/50">Monthly</div>
               </div>

               <div className="h-9 rounded-lg bg-terracotta flex items-center justify-center text-xs font-medium text-surface">
                 Contribute GHS 100
               </div>
             </div>
          </div>
        );
      case "recurring":
        return (
          <div className="w-full h-full bg-cream rounded-2xl border border-border p-8 flex items-center justify-center">
             <div className="flex bg-surface p-1 rounded-lg border border-border shadow-sm w-full max-w-xs">
               <div className="flex-1 py-2 text-center text-sm text-ink-muted">One-time</div>
               <div className="flex-1 py-2 text-center text-sm font-medium bg-cream rounded-md border border-border shadow-sm">Monthly</div>
             </div>
          </div>
        );
      case "dashboard":
        return (
          <div className="w-full h-full bg-surface rounded-2xl shadow-product border border-border p-6 flex flex-col gap-4">
             <div className="flex justify-between items-end">
               <div>
                 <div className="text-xs text-ink-muted uppercase tracking-wider font-mono">Total Collected</div>
                 <div className="text-2xl font-display mt-1">GHS 42,500</div>
               </div>
               <div className="badge badge-success">↑ 12%</div>
             </div>
             <div className="flex-1 w-full bg-cream rounded-lg border border-border relative overflow-hidden mt-4">
                {/* Mock Chart Area */}
                 <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-terracotta/10"></div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,100 L0,70 L20,60 L40,80 L60,40 L80,50 L100,20 L100,100 Z" fill="none" stroke="var(--color-terracotta)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                </svg>
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
        
        <div className="mb-16 md:mb-24 max-w-2xl">
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
