"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";

// =============================================================================
// HERO — Kivaro headline + product visualization with payment card mock
// =============================================================================

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // --- Initial entrance animation (GSAP) ---
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(
        [Array.from(headlineRef.current?.children ?? []), copyRef.current, ctaRef.current, imageRef.current].filter(Boolean),
        { opacity: 1, y: 0, x: 0, scale: 1 }
      );
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      Array.from(headlineRef.current?.children ?? []),
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.09, delay: 0.2 }
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
        { scale: 0.97, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 1.1, ease: "power2.out" },
        "-=0.8"
      );

    return () => {
      tl.kill();
    };
  }, []);

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
              {"Recurring payments, made simple.".split(" ").map((word, i) => (
                <span
                  key={i}
                  className={`inline-block overflow-hidden align-top ${
                    i !== "Recurring payments, made simple.".split(" ").length - 1
                      ? "mr-[0.25em]"
                      : ""
                  }`}
                >
                  <span className={`inline-block will-change-transform ${i === 0 ? "text-terracotta" : ""}`}>
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            <p
              ref={copyRef}
              className="text-body-lg text-balance max-w-lg opacity-0"
            >
              Payment links and QR codes for Mobile Money — one-time or recurring —
              with every contribution tracked in a single dashboard. Built for
              organizations collecting across Ghana.
            </p>

            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center gap-4 pt-2 opacity-0"
            >
              <Link href="/register" className="btn-primary w-full sm:w-auto text-center">
                Get Started
              </Link>
              <a href="#how-it-works" className="btn-secondary w-full sm:w-auto">
                See How It Works
              </a>
            </div>
          </div>

          {/* --- Right Column: Product Visualization --- */}
          <div
            ref={imageRef}
            className="lg:col-span-7 relative opacity-0 h-[440px] sm:h-[520px] lg:h-[600px] w-full"
          >
            {/* Photography with flat dark overlay */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden bg-surface border border-border">
              <Image
                src="/images/landing/hero.jpg"
                alt="Organization team meeting"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 30%" }}
              />
              <div className="absolute inset-0 bg-[#050A08]/70"></div>
            </div>

            {/* Ambient glow behind the mock card */}
            <div className="absolute -bottom-14 -right-10 w-72 h-72 rounded-full bg-terracotta/20 blur-3xl animate-glow pointer-events-none"></div>

            {/* Floating activity chips */}
            <div className="absolute top-8 left-6 sm:left-10 z-20 animate-float pointer-events-none">
              <div className="flex items-center gap-2.5 bg-surface/90 backdrop-blur border border-border rounded-xl px-3 py-2 shadow-product">
                <div className="w-7 h-7 rounded-full bg-terracotta text-[#051009] flex items-center justify-center text-[11px] font-medium">
                  A
                </div>
                <div>
                  <div className="text-[11px] font-medium leading-tight text-ink">Ama contributed</div>
                  <div className="text-[11px] font-mono text-ink-muted leading-tight">GHS 100 · just now</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className="absolute top-24 right-6 sm:right-8 z-20 animate-float-delay pointer-events-none hidden sm:block">
              <div className="flex items-center gap-2.5 bg-surface/90 backdrop-blur border border-border rounded-xl px-3 py-2 shadow-product">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
                </svg>
                <div>
                  <div className="text-[11px] font-medium leading-tight text-ink">Recurring active</div>
                  <div className="text-[11px] font-mono text-ink-muted leading-tight">GHS 100 / month</div>
                </div>
              </div>
            </div>

            {/* Kivaro payment card mock */}
            <motion.div
              className="absolute -bottom-6 left-6 right-6 mx-auto max-w-[400px] lg:mx-0 lg:left-[-3rem] 2xl:left-[-6rem] lg:right-auto lg:w-[360px] bg-surface p-6 rounded-2xl shadow-product border border-border z-30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded bg-terracotta flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <span className="font-display font-medium text-xs leading-none text-[#051009]">
                      K
                    </span>
                  </span>
                  <span className="font-mono text-xs font-medium tracking-[0.18em] uppercase text-ink">
                    KIVARO
                  </span>
                </div>
                <span className="badge badge-success gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
                  Active
                </span>
              </div>

              {/* Shimmer sweep across the card */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
              </div>

              <div className="mb-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">
                  Monthly Support
                </div>
                <div className="font-display text-3xl text-ink">
                  GHS 50 <span className="text-lg text-ink-muted font-body">Monthly</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border text-[13px]">
                <span className="text-ink-muted">Next payment</span>
                <span className="font-mono text-ink">14 Oct 2026</span>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-border">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-terracotta)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[13px] font-medium text-ink">
                  Mobile Money Authorized
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
