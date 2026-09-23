"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// CAMPAIGNS + QR SECTION
// =============================================================================

export default function CampaignsQR() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Respect reduced-motion: show everything at full state, no choreography.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const targets = [
        cardRef.current,
        imageRef.current,
        qrRef.current,
        progressRef.current,
        ...itemsRef.current.filter(Boolean),
      ].filter(Boolean);
      gsap.set(targets, {
        opacity: 1,
        scale: 1,
        width: "62%",
        x: 0,
      });
      return;
    }

    gsap.set(progressRef.current, { width: "0%" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 70%",
        toggleActions: "play none none none",
      }
    });

    tl.fromTo(
      imageRef.current,
      { opacity: 0, scale: 0.95, filter: "blur(10px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "power3.out" }
    )
    .fromTo(
      cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.6"
    )
    .fromTo(
      qrRef.current,
      { scale: 0.8, opacity: 0.4 },
      { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.6)" },
      "-=0.4"
    )
    .fromTo(
      progressRef.current,
      { width: "0%" },
      { width: "62%", duration: 1.2, ease: "power2.inOut" },
      "-=0.5"
    )
    .fromTo(
      itemsRef.current,
      { opacity: 0, x: -15 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
      "-=0.8"
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-surface">
      <div className="section-container">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* --- Left Column: Campaigns & QR Card --- */}
          <div className="order-2 lg:order-1 relative perspective-1000">
            <div
              ref={cardRef}
              className="relative bg-cream rounded-3xl border border-border shadow-elevated p-6 sm:p-8 max-w-md mx-auto opacity-0"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="badge badge-warning mb-3">Active Campaign</div>
                  <h3 className="text-xl">Community Water Project</h3>
                </div>
                <button className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-ink hover:bg-border/50 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              </div>

              {/* Progress */}
              <div className="mb-8">
                <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-1 text-sm mb-2">
                  <span className="font-mono font-medium">GHS 12,400 <span className="text-ink-muted font-body">raised</span></span>
                  <span className="text-ink-muted font-mono">Goal: GHS 20,000</span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div ref={progressRef} className="h-full bg-terracotta rounded-full"></div>
                </div>
              </div>

              {/* Floating new-contribution chip */}
              <div className="absolute top-4 right-6 z-20 animate-float pointer-events-none">
                <div className="flex items-center gap-2 bg-surface/90 backdrop-blur border border-border rounded-xl px-3 py-2 shadow-product">
                  <div className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse"></div>
                  <span className="text-[11px] font-medium text-ink">New · GHS 100</span>
                </div>
              </div>

              {/* QR Code Area */}
              <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col items-center">
                <div ref={qrRef} className="p-4 bg-cream rounded-xl border border-border mb-4">
                  {/* Mock QR Code */}
                  <div className="w-32 h-32 grid grid-cols-5 grid-rows-5 gap-1 opacity-80">
                     {Array.from({length: 25}).map((_, i) => (
                       <div key={i} className={`bg-ink rounded-sm ${i%4===0 || i%7===0 ? 'opacity-10' : ''}`}></div>
                     ))}
                  </div>
                </div>
                
                <div className="w-full flex items-center justify-between p-3 rounded-lg bg-cream border border-border mb-4">
                  <span className="text-sm font-mono text-ink-muted truncate mr-4">kivaro.app/c/water-project</span>
                  <button className="text-xs font-medium text-terracotta whitespace-nowrap hover:underline">Copy Link</button>
                </div>

                <p className="text-xs text-ink-muted text-center max-w-[200px]">
                  Supporters can scan this QR code or click the link to contribute.
                </p>
              </div>
            </div>
          </div>

          {/* --- Right Column: Copy & Photography --- */}
          <div className="order-1 lg:order-2">
            <span className="section-label mb-4 block">Dedicated Campaigns</span>
            <h2 className="mb-6">Fund specific goals, visibly.</h2>
            <p className="text-body-lg mb-8">
              Whether it&apos;s a building project, an event, or an emergency fund — create specific campaigns with clear goals and track exactly where contributions are going.
            </p>

            <div className="flex flex-col sm:flex-row gap-8 items-start">
              
              <ul className="space-y-3 flex-1 shrink-0">
                <li className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-2">Share anywhere</li>
                {[
                  "Printed on event posters",
                  "Displayed at physical locations",
                  "Embedded on your website",
                  "Shared in WhatsApp groups",
                  "Posted on social media"
                ].map((item, i) => (
                  <li 
                    key={i} 
                    ref={(el) => { itemsRef.current[i] = el; }}
                    className="flex items-center gap-2 text-ink opacity-0"
                  >
                    <div className="w-1 h-1 rounded-full bg-terracotta"></div>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Context Photograph */}
              <div 
                ref={imageRef}
                className="relative w-full sm:w-48 h-48 rounded-2xl overflow-hidden border border-border shadow-sm shrink-0 bg-border/50 opacity-0"
              >
                <Image 
                  src="/images/landing/campaign.jpg" 
                  alt="Community event where a payment sign could be used" 
                  fill
                  sizes="(min-width: 1024px) 200px, 100vw"
                  className="object-cover"
                />
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
