"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatCurrency } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// RECURRING PAYMENTS — Timeline Animation
// =============================================================================

const TIMELINE_DATA = [
  { month: "January", amount: 100, status: "Paid" },
  { month: "February", amount: 100, status: "Paid" },
  { month: "March", amount: 100, status: "Paid" },
  { month: "April", amount: 100, status: "Paid" },
  { month: "May", amount: 100, status: "Paid" },
  { month: "June", amount: 100, status: "Scheduled" },
];

export default function RecurringPayments() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Timeline animation triggered on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 60%",
        end: "bottom 80%",
        scrub: 1, // Smooth scrubbing effect
      }
    });

    // Animate the connecting line down
    tl.fromTo(
      lineRef.current,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", duration: 1 }
    );

    // Stagger reveal the timeline items as the line passes them
    itemsRef.current.forEach((item, index) => {
      if (!item) return;
      
      const isScheduled = TIMELINE_DATA[index].status === "Scheduled";
      
      // Calculate start time relative to timeline duration (1.0)
      const startTime = index / (TIMELINE_DATA.length - 1) * 0.8;
      
      tl.fromTo(
        item,
        { opacity: 0, x: -20, filter: "blur(4px)" },
        { 
          opacity: isScheduled ? 0.6 : 1, 
          x: 0, 
          filter: "blur(0px)",
          duration: 0.2, 
          ease: "power2.out" 
        },
        startTime
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-cream border-t border-border">
      <div className="section-container">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* --- Left Column: Copy --- */}
          <div className="max-w-lg">
            <span className="section-label mb-4 block">Recurring Payments</span>
            <h2 className="mb-6">Predictable support, automatically.</h2>
            <p className="text-body-lg mb-8">
              Stop chasing payments every month. Supporters authorize a recurring schedule, and Cowrie helps manage the payments that follow.
            </p>
            
            <ul className="space-y-4">
              {[
                "Daily, weekly, or monthly schedules",
                "Automatic retry logic for failed payments",
                "Supporters can manage their own subscriptions"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-ink-light">
                  <div className="mt-1 w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* --- Right Column: Timeline Animation --- */}
          <div className="relative p-5 sm:p-8 lg:p-12 bg-surface rounded-3xl border border-border shadow-card overflow-hidden">
            
            {/* Background gradient hint */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative pl-5 sm:pl-6">
              {/* Connecting Line */}
              <div 
                className="absolute left-0 top-4 bottom-4 sm:top-6 sm:bottom-6 w-0.5 bg-border rounded-full origin-top"
              ></div>
              <div 
                ref={lineRef}
                className="absolute left-0 top-4 bottom-4 sm:top-6 sm:bottom-6 w-0.5 bg-terracotta rounded-full origin-top z-10"
              ></div>

              {/* Timeline Items */}
              <div className="flex flex-col gap-5 sm:gap-6">
                {TIMELINE_DATA.map((item, index) => (
                  <div 
                    key={index}
                    ref={(el) => { itemsRef.current[index] = el; }}
                    className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3.5 sm:p-4 rounded-xl bg-cream border border-border shadow-sm"
                  >
                    {/* Node Dot */}
                    <div className={`absolute -left-[25px] sm:-left-[29px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-surface z-20 ${
                      item.status === "Paid" 
                        ? "border-terracotta" 
                        : "border-border"
                    }`}>
                      {item.status === "Paid" && (
                        <div className="absolute inset-0.5 bg-terracotta rounded-full"></div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-medium text-ink text-sm sm:text-base w-16 sm:w-20">{item.month}</div>
                      <div className="font-mono text-sm text-ink-muted">{formatCurrency(item.amount)}</div>
                    </div>

                    <div className={`badge ${
                      item.status === "Paid" ? "badge-success" : "bg-surface text-ink-muted border-border"
                    }`}>
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
}
