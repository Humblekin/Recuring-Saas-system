"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

// =============================================================================
// HERO SECTION — Premium, Organization-Focused, Animated
// =============================================================================

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Interactive Payment Card State
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<"One-time" | "Monthly">("Monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Initial Entrance Animation (GSAP) ---
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Ensure elements are initially hidden via CSS classes
    tl.fromTo(
      headlineRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.2 }
    )
      .fromTo(
        copyRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(
        imageRef.current,
        { scale: 0.95, opacity: 0, x: 20 },
        { scale: 1, opacity: 1, x: 0, duration: 1.2, ease: "power2.out" },
        "-=1"
      );

    return () => {
      tl.kill();
    };
  }, []);

  // --- Payment Demo Interaction Handler ---
  const handlePaymentSubmit = () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    
    // Simulate realistic processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }, 1500);
  };

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-44 lg:pb-32 overflow-x-clip"
    >
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* --- Left Column: Copy --- */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8 z-20">
            <h1 
              ref={headlineRef}
              className="tracking-tight text-balance opacity-0"
            >
              Give your organization a better way to collect.
            </h1>
            
            <p 
              ref={copyRef}
              className="text-body-lg text-balance max-w-lg opacity-0"
            >
              Share payment links and QR codes, accept one-time or recurring 
              contributions, and manage everything from a single dashboard. 
              Built for organizations moving forward.
            </p>
            
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center gap-4 pt-2 opacity-0"
            >
              <Link href="/register" className="btn-primary w-full sm:w-auto text-center">
                Create your payment link
              </Link>
              <a href="#how-it-works" className="btn-secondary w-full sm:w-auto">
                See how it works
              </a>
            </div>
          </div>

          {/* --- Right Column: Photography & Interactive UI --- */}
          <div 
            ref={imageRef}
            className="lg:col-span-7 relative opacity-0 h-[420px] sm:h-[500px] lg:h-[620px] w-full rounded-2xl md:rounded-3xl overflow-visible"
          >
            {/* Premium Photography */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden bg-border">
              <Image 
                src="/images/landing/hero.jpg" 
                alt="Professional African organization team meeting in a modern office"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover origin-center"
                style={{ objectPosition: "50% 30%" }}
              />
              {/* Subtle gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-tr from-ink/30 to-transparent"></div>
            </div>

            {/* Floating Interactive Payment Card */}
            <motion.div 
              className="absolute -bottom-6 left-6 right-6 mx-auto max-w-[420px] lg:mx-0 lg:left-[-3rem] 2xl:left-[-6rem] lg:right-auto lg:w-[360px] bg-surface p-6 rounded-2xl shadow-product border border-border z-30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center border border-border">
                  <span className="font-display font-medium text-terracotta">HW</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">HopeWorks Ghana</div>
                  <div className="text-xs text-ink-muted font-mono uppercase tracking-wider">Community Project</div>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`py-2 rounded-md font-mono text-sm transition-all ${
                      selectedAmount === amount 
                        ? "bg-ink text-surface shadow-sm" 
                        : "bg-cream text-ink-light hover:bg-border"
                    }`}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>

              {/* Frequency Selection */}
              <div className="flex p-1 bg-cream rounded-lg mb-6">
                {(["One-time", "Monthly"] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFrequency(freq)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      frequency === freq 
                        ? "bg-surface text-ink shadow-sm border border-border/50" 
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <button 
                onClick={handlePaymentSubmit}
                disabled={isProcessing || isSuccess}
                className="w-full btn-primary py-3 relative overflow-hidden"
              >
                <motion.span
                  initial={false}
                  animate={{ 
                    y: isProcessing || isSuccess ? -40 : 0,
                    opacity: isProcessing || isSuccess ? 0 : 1 
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  Contribute {formatCurrency(selectedAmount)}
                </motion.span>
                
                <motion.span
                  initial={false}
                  animate={{ 
                    y: isProcessing ? 0 : 40,
                    opacity: isProcessing ? 1 : 0 
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                </motion.span>

                <motion.span
                  initial={false}
                  animate={{ 
                    y: isSuccess ? 0 : 40,
                    opacity: isSuccess ? 1 : 0 
                  }}
                  className="absolute inset-0 flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Success
                </motion.span>
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
