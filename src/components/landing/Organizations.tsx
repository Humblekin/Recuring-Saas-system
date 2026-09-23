"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =============================================================================
// ORGANIZATIONS — Typography & Photography driven
// =============================================================================

const ORGS = [
  {
    title: "NGOs",
    desc: "Collect recurring supporter contributions safely and predictably."
  },
  {
    title: "Schools",
    desc: "Collect fees, PTA dues, or community development contributions."
  },
  {
    title: "Associations",
    desc: "Easily track and collect membership payments from everyone."
  },
  {
    title: "Nonprofits",
    desc: "Run dedicated fundraising campaigns for specific initiatives."
  },
  {
    title: "Communities",
    desc: "Share payment links and QR codes wherever your people are."
  }
];

export default function Organizations() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 60%",
        toggleActions: "play none none none",
      }
    });

    // Reveal Image
    tl.fromTo(
      imageRef.current,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 1, ease: "power3.out" }
    );

    // Stagger reveal text rows
    if (listRef.current) {
      tl.fromTo(
        listRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.6"
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-cream border-t border-border">
      <div className="section-container">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* --- Left Column: Large Editorial Photography --- */}
          <div 
            ref={imageRef}
            className="relative w-full h-[300px] sm:h-[420px] md:h-[500px] lg:h-[700px] rounded-3xl overflow-hidden bg-border/50 shadow-sm opacity-0"
          >
            <Image 
              src="/images/landing/team-meeting.jpg" 
              alt="Professional African community leaders" 
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          </div>

          {/* --- Right Column: Typography-driven List --- */}
          <div>
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl">One platform.<br/>Many organizations.</h2>
            </div>
            
            <div ref={listRef} className="flex flex-col">
              {ORGS.map((org, index) => (
                <div 
                  key={org.title} 
                  className={`py-6 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 opacity-0 ${
                    index !== 0 ? "border-t border-border" : ""
                  }`}
                >
                  <h3 className="w-40 font-display text-2xl shrink-0 text-ink">{org.title}</h3>
                  <p className="text-body text-balance">{org.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
