"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// =============================================================================
// NAVBAR — Sticky, shrinks on scroll, mobile menu
// =============================================================================

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // --- Scroll handler: shrink nav on scroll ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Intersection Observer for active section ---
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -70% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // --- Close mobile menu on navigation ---
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      setIsMobileOpen(false);
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    },
    []
  );

  // --- Lock body scroll when mobile menu is open ---
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      <nav
        id="main-nav"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-cream/95 backdrop-blur-md shadow-subtle py-3"
            : "bg-transparent py-5"
        }`}
        style={{
          transitionTimingFunction: "var(--ease-in-out-smooth)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="section-container flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-ink no-underline"
            aria-label="Cowrie home"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                    fill="white"
                  />
                  <ellipse cx="12" cy="12" rx="5" ry="7" stroke="white" strokeWidth="1.5" fill="none" />
                  <ellipse cx="12" cy="12" rx="2" ry="3.5" fill="white" opacity="0.6" />
                </svg>
              </div>
              <span
                className="text-xl tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                Cowrie
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium transition-colors duration-300 no-underline ${
                  activeSection === link.href.slice(1)
                    ? "text-terracotta"
                    : "text-ink-muted hover:text-ink"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {link.label}
              </a>
            ))}

            <Link
              href="/login"
              className="text-sm font-medium transition-colors duration-300 no-underline text-ink-muted hover:text-ink"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Sign in
            </Link>

            <Link href="/register" className="btn-primary text-sm py-2.5 px-5">
              Create your payment link
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-toggle"
            className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          >
            <motion.span
              className="block w-5 h-[1.5px] bg-ink origin-center"
              animate={
                isMobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }
              }
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-[1.5px] bg-ink"
              animate={isMobileOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-[1.5px] bg-ink origin-center"
              animate={
                isMobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }
              }
              transition={{ duration: 0.3 }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-cream pt-24 px-6 md:hidden overflow-y-auto pb-10"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`text-2xl no-underline transition-colors ${
                    activeSection === link.href.slice(1)
                      ? "text-terracotta"
                      : "text-ink"
                  }`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4 border-t border-border"
              >
                <Link
                  href="/login"
                  className="text-2xl no-underline text-ink transition-colors"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Sign in
                </Link>

                <Link href="/register" className="btn-primary w-full text-center">
                  Create your payment link
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
