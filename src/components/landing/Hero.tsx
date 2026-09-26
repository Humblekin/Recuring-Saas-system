"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  ChartIcon,
  CheckIcon,
  RecurringIcon,
  ShareIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { useTheme } from "@/components/ui/ThemeProvider";

// The stage artwork has a light-mode variant. Same container, framing and
// crop in both — only the source differs. Read from the existing theme
// context so the toggle already on the page drives it.
const HERO_IMAGE_DARK = "/images/landing/momo.png";
const HERO_IMAGE_LIGHT = "/images/landing/momo-logo-2png.png";

// =============================================================================
// HERO — Premium dark fintech hero, MoMo-ready
//   LEFT  = recurring-payments headline + copy + CTAs (always readable)
//   RIGHT = momo.png stage with light vignette, then a balanced 50/50 grid
//           of the Kivaro dashboard + phone panels. No element overlaps
//           another; panels are equal width and stretch to equal height.
// =============================================================================

const HEADLINE_LINES = [
  { words: ["Recurring", "payments,"], className: "" },
  { words: ["made", "simple."], className: "text-terracotta" },
];

const TRUST_ITEMS = ["Secure", "Authorized", "Transparent", "Trackable"];

const FEATURES = [
  {
    icon: RecurringIcon,
    title: "Create Payment Plans",
    desc: "Set amount, purpose and frequency.",
  },
  {
    icon: ShareIcon,
    title: "Share Your Link / QR",
    desc: "Share through WhatsApp, social media, website or SMS.",
  },
  {
    icon: WalletIcon,
    title: "Supporters Authorize",
    desc: "Supporters choose their amount and frequency and authorize payment through MoMo.",
  },
  {
    icon: ChartIcon,
    title: "Track & Manage",
    desc: "Monitor collections, supporters and payment status.",
  },
];

function MomoBolt({ className = "text-gold", size = 12 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Hero() {
  const { theme } = useTheme();
  const heroImage = theme === "light" ? HERO_IMAGE_LIGHT : HERO_IMAGE_DARK;

  const headlineRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  // --- Entrance animation. Content is visible by default; GSAP only hides
  //     it briefly for the reveal, so text can never be stuck invisible. ---
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      Array.from(headlineRef.current?.querySelectorAll(".hero-word") ?? []),
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, delay: 0.2 }
    )
      .fromTo(
        copyRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.55"
      )
      .fromTo(
        visualRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
        "-=0.7"
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      id="product"
      className="relative pt-28 pb-16 md:pt-36 md:pb-20 lg:pt-40 lg:pb-24 overflow-x-clip"
      aria-label="Kivaro recurring payments hero"
    >
      {/* --- Ambient background: green + MoMo gold glow, curved lines --- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-48 left-[-12%] w-[46rem] h-[46rem] rounded-full bg-terracotta/[0.09] blur-[140px]" />
        <div className="absolute top-[-8rem] right-[-14%] w-[40rem] h-[40rem] rounded-full bg-gold/[0.07] blur-[140px]" />
        <svg
          className="absolute right-[-6%] top-[6%] w-[560px] h-[380px] text-terracotta/10"
          viewBox="0 0 600 400"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M0 320 C 200 300, 320 180, 600 60" strokeWidth="1.5" />
          <path d="M0 352 C 220 330, 360 210, 600 92" strokeWidth="1" opacity="0.6" />
          <path d="M0 384 C 240 360, 400 246, 600 124" strokeWidth="0.8" opacity="0.4" />
        </svg>
      </div>

      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center">

          {/* ============ LEFT — Recurring payments headline + copy ============ */}
          <div className="lg:col-span-4 relative z-20 flex flex-col gap-7 lg:gap-8 lg:py-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-gold/12 flex items-center justify-center">
                <MomoBolt className="text-gold" size={15} />
              </span>
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-light">
                Recurring payments · Mobile Money powered
              </span>
            </div>

            <h1
              ref={headlineRef}
              className="tracking-tight leading-[1.05] text-balance"
            >
              {HEADLINE_LINES.map((line, li) => (
                <span key={li} className={`block ${line.className}`}>
                  {line.words.map((word, wi) => (
                    <span key={word} className="inline-block overflow-hidden align-top">
                      <span
                        className={`hero-word inline-block will-change-transform ${
                          wi === line.words.length - 1 ? "" : "mr-[0.24em]"
                        }`}
                      >
                        {word}
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </h1>

            <p
              ref={copyRef}
              className="text-body-lg text-ink-light text-balance max-w-lg"
            >
              Kivaro helps churches, NGOs, schools, communities and businesses
              collect recurring contributions digitally — with secure Mobile
              Money experiences built for Ghana.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
              <Link
                href="/register"
                className="btn-primary group w-full sm:w-auto text-center !px-8"
              >
                Get Started
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a href="#how-it-works" className="btn-secondary w-full sm:w-auto">
                See How It Works
              </a>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-[13px] text-ink-light">
                  <span className="w-4 h-4 rounded-full bg-terracotta/15 flex items-center justify-center text-terracotta">
                    <CheckIcon size={11} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ============ RIGHT — momo.png stage + dashboard & phone panels ============ */}
          <div ref={visualRef} className="lg:col-span-8 relative">
            <div className="relative w-full">

              {/* --- Stage: Ghanaian man using Kivaro (MoMo reference) --- */}
              <div className="relative">
                {/* Ambient glow behind the stage only */}
                <div
                  className="pointer-events-none absolute -inset-6 rounded-full bg-terracotta/[0.06] blur-3xl animate-glow"
                  aria-hidden="true"
                />

                <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl border border-ink/10 overflow-hidden bg-surface shadow-product">
                  <Image
                    src={heroImage}
                    alt="Ghanaian man using the Kivaro app on his smartphone"
                    fill
                    priority
                    sizes="(min-width: 1024px) 63vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: "50% 40%" }}
                  />
                  {/* Light vignette — keeps the subject readable, blends bottom edge */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#050B08]/40 via-transparent to-transparent"
                    aria-hidden="true"
                  />

                  {/* Powered by MoMo pill (stage bottom-left) */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/15 bg-[#0A120E]/75 backdrop-blur px-3 py-1.5">
                    <MomoBolt className="text-gold" size={12} />
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white">
                      Powered by MoMo
                    </span>
                  </div>

                  {/* QR / Scan-to-Pay card (stage top-right, hidden on small screens) */}
                  <div className="absolute top-3 right-3 hidden lg:flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0A120E]/85 backdrop-blur px-3.5 py-3 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between gap-4">
<span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/80">
                      Scan to Pay
                    </span>
                      <MomoBolt className="text-gold" size={11} />
                    </div>
                    <div className="text-[11.5px] font-medium text-white">
                      Support ABC Organization
                    </div>
                    <div className="rounded-lg bg-white p-1.5 flex justify-center">
                      <QRCodeSVG
                        value="https://kivaro.app/pay/abc-organization"
                        size={72}
                        marginSize={0}
                        fgColor="#0B1410"
                        bgColor="#FFFFFF"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-white/80">
                      <span className="w-1 h-1 rounded-full bg-terracotta animate-pulse" />
                      MoMo · recurring ready
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Below stage: nothing — clean image stage only --- */}
            </div>
          </div>
        </div>

        {/* ============ BOTTOM FEATURE STRIP ============ */}
        <div className="relative mt-16 lg:mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden shadow-subtle">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-surface p-6 lg:p-7 flex flex-col gap-3.5"
              >
                <span className="w-10 h-10 rounded-xl border border-terracotta/25 bg-terracotta/10 flex items-center justify-center text-terracotta">
                  <feature.icon size={18} />
                </span>
                <h3 className="text-[15px] font-medium text-ink tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-ink-light">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}