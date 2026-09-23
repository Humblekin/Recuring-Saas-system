"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatCurrency } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// DASHBOARD — Realistic SaaS Mockup with GSAP sequence
// =============================================================================

const CONTRIBUTORS = [
  { name: "Kwame Osei", amount: 500, type: "Monthly", status: "Success", time: "2h ago" },
  { name: "Ama Mensah", amount: 100, type: "One-time", status: "Success", time: "5h ago" },
  { name: "Kofi Annan", amount: 250, type: "Monthly", status: "Success", time: "1d ago" },
  { name: "Abena Serwaa", amount: 1000, type: "One-time", status: "Pending", time: "1d ago" },
];

export default function Dashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  
  // Animation refs
  const totalRef = useRef<HTMLDivElement>(null);
  const recurringTotalRef = useRef<HTMLSpanElement>(null);
  const chartPathRef = useRef<SVGPathElement>(null);
  const chartPointsRef = useRef<HTMLDivElement>(null);
  const listRowsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const recurringInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mockupRef.current;
    if (!el) return;

    // Respect reduced-motion: everything visible immediately, no count-up.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    // Reset initial states for animation
    gsap.set(el, { opacity: 0, y: 40 });
    gsap.set(chartPathRef.current, { strokeDasharray: 1000, strokeDashoffset: 1000 });
    if (chartPointsRef.current) gsap.set(chartPointsRef.current.children, { opacity: 0, scale: 0 });
    if (listRowsRef.current) gsap.set(listRowsRef.current.children, { opacity: 0, x: -10 });
    gsap.set(indicatorRef.current, { opacity: 0 });
    gsap.set(recurringInfoRef.current, { opacity: 0, y: 10 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        toggleActions: "play none none none",
      },
      defaults: { ease: "power2.out" }
    });

    const totalCounter = { val: 0 };
    const recurringCounter = { val: 0 };

    // 1. Dashboard container reveals
    tl.to(el, { opacity: 1, y: 0, duration: 0.8 })
      
      // 2. Total collected counts up
      .to(totalCounter, {
        val: 42500,
        duration: 1.4,
        ease: "power1.out",
        onUpdate: () => {
          if (totalRef.current) {
            totalRef.current.textContent = formatCurrency(Math.round(totalCounter.val));
          }
        }
      }, "-=0.4")
      
      // 3. Chart draws naturally
      .to(chartPathRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.inOut"
      }, "-=0.2")
      
      // 4. Data points appear sequentially
      .to(chartPointsRef.current ? chartPointsRef.current.children : [], {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.5)"
      }, "-=1")
      
      // 5. Contributor rows stagger in
      .to(listRowsRef.current ? listRowsRef.current.children : [], {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.08
      }, "-=0.8")
      
      // 6. Status indicator updates
      .to(indicatorRef.current, {
        opacity: 1,
        duration: 0.4
      }, "-=0.4")
      
      // 7. Recurring info appears + its total counts up
      .to(recurringInfoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5
      }, "-=0.3")
      .to(recurringCounter, {
        val: 12800,
        duration: 1.2,
        ease: "power1.out",
        onUpdate: () => {
          if (recurringTotalRef.current) {
            recurringTotalRef.current.textContent = formatCurrency(Math.round(recurringCounter.val));
          }
        }
      }, "-=0.5");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="py-24 md:py-32 bg-surface overflow-hidden">
      <div className="section-container" ref={containerRef}>
        
        <div className="mb-16 max-w-2xl">
          <span className="section-label mb-4 block">Organization Dashboard</span>
          <h2>Everything in one place.</h2>
          <p className="text-body-lg">
            A clear, real-time view of every contribution. Manage payouts, track recurring schedules, and export your data instantly.
          </p>
        </div>

        {/* Dashboard Mockup Container */}
        <div 
          ref={mockupRef}
          className="w-full max-w-5xl mx-auto bg-cream rounded-2xl md:rounded-3xl border border-border shadow-elevated overflow-hidden"
        >
          {/* Mockup Header (Nav) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
            <div className="flex items-center gap-6">
              <div className="font-display font-medium text-lg tracking-tight">Kivaro</div>
              <div className="hidden sm:flex gap-4 text-sm font-medium">
                <span className="text-ink bg-cream px-3 py-1.5 rounded-md border border-border">Overview</span>
                <span className="text-ink-muted hover:text-ink px-3 py-1.5 transition-colors">Contributions</span>
                <span className="text-ink-muted hover:text-ink px-3 py-1.5 transition-colors">Campaigns</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div ref={indicatorRef} className="hidden sm:flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                Live
              </div>
              <div className="w-8 h-8 rounded-full bg-terracotta text-[#051009] flex items-center justify-center font-medium text-xs">
                HW
              </div>
            </div>
          </div>

          {/* Mockup Body */}
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Left Column: Chart & Stats */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Top Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                  <div className="text-xs text-ink-muted uppercase tracking-wider font-mono mb-2">Total Collected (30d)</div>
                  <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                    <div ref={totalRef} className="font-display text-3xl md:text-4xl whitespace-nowrap">{formatCurrency(42500)}</div>
                    <div className="text-success text-sm font-medium flex items-center gap-1 shrink-0">
                      <span>↑</span> 12.5%
                    </div>
                  </div>
                </div>
                
                <div ref={recurringInfoRef} className="bg-surface p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                  <div className="text-xs text-ink-muted uppercase tracking-wider font-mono mb-2">Active Recurring</div>
                  <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                    <div className="font-display text-3xl md:text-4xl whitespace-nowrap">
                      <span ref={recurringTotalRef}>{formatCurrency(12800)}</span>
                      <span className="text-lg text-ink-muted font-body">/mo</span>
                    </div>
                    <div className="text-ink-muted text-sm font-medium shrink-0">
                      142 supporters
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex-1 min-h-[250px] relative">
                 <div className="flex justify-between items-center mb-6">
                   <div className="text-sm font-medium">Revenue Trend</div>
                   <div className="text-xs text-ink-muted bg-cream px-2 py-1 rounded border border-border">This Month</div>
                 </div>
                 
                 <div className="absolute left-5 right-5 bottom-5 top-16">
                   {/* Y-axis lines */}
                   <div className="absolute inset-0 flex flex-col justify-between">
                     {[1, 2, 3, 4].map((i) => (
                       <div key={i} className="w-full border-b border-border/50 border-dashed"></div>
                     ))}
                   </div>
                   
                   {/* SVG Chart Line */}
                     <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                       <path 
                         d="M0,80 L15,65 L30,75 L45,40 L60,45 L75,20 L90,25 L100,10" 
                         fill="var(--color-terracotta)" 
                         fillOpacity="0.12"
                       />
                     <path 
                       ref={chartPathRef}
                       d="M0,80 L15,65 L30,75 L45,40 L60,45 L75,20 L90,25 L100,10" 
                       fill="none" 
                       stroke="var(--color-terracotta)" 
                       strokeWidth="2.5" 
                       vectorEffect="non-scaling-stroke"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                     />
                   </svg>
                   
                   {/* Data Points */}
                   <div ref={chartPointsRef} className="absolute inset-0 w-full h-full">
                      {[
                        { x: '15%', y: '65%' },
                        { x: '30%', y: '75%' },
                        { x: '45%', y: '40%' },
                        { x: '60%', y: '45%' },
                        { x: '75%', y: '20%' },
                        { x: '90%', y: '25%' },
                        { x: '100%', y: '10%' },
                      ].map((pos, i) => (
                        <div 
                          key={i} 
                          className="absolute w-2.5 h-2.5 bg-surface border-2 border-terracotta rounded-full -ml-[5px] -mt-[5px]"
                          style={{ left: pos.x, top: pos.y }}
                        ></div>
                      ))}
                   </div>
                 </div>
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="text-sm font-medium">Recent Activity</div>
                <button className="text-xs text-terracotta hover:underline">View All</button>
              </div>
              
              <div ref={listRowsRef} className="flex flex-col gap-4">
                {CONTRIBUTORS.map((contributor, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-3 rounded-lg hover:bg-cream transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center text-xs font-medium text-ink-muted shrink-0">
                        {contributor.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{contributor.name}</div>
                        <div className="text-xs text-ink-muted flex items-center gap-1 whitespace-nowrap">
                          {contributor.time} <span className="text-[0.5rem]">•</span> {contributor.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-medium">{formatCurrency(contributor.amount)}</div>
                      <div className={`text-[10px] uppercase tracking-wider font-medium ${contributor.status === 'Success' ? 'text-success' : 'text-warning'}`}>
                        {contributor.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="mt-auto pt-4 w-full text-center text-sm font-medium text-ink-muted hover:text-ink transition-colors border-t border-border border-dashed">
                Export CSV
              </button>
            </div>
            
          </div>
        </div>
        
        <p className="text-center text-xs text-ink-muted mt-6 uppercase tracking-widest font-mono">
          Illustrative Dashboard
        </p>

      </div>
    </section>
  );
}
