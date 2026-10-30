"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { InkloomLogo } from "@/components/layout/InkloomLogo";
import { ThemeToggle } from "@/services/theme-context";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  Building,
  Palette,
  FileText,
  UserCheck,
  Lock,
  Clock,
  CheckCircle2,
  Scale,
  Sliders,
  Menu,
  X,
} from "lucide-react";

import { motion, MotionConfig, AnimatePresence } from "motion/react";

/**
 * High-performance, accessible Scroll Reveal component powered by Motion
 * - Automatically respects prefers-reduced-motion via MotionConfig
 * - Uses hardware-accelerated transforms and springs
 */
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  yOffset?: number;
}

function Reveal({
  children,
  className = "",
  delayMs = 0,
  durationMs = 450,
  yOffset = 14,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some", margin: "0px 0px 80px 0px" }}
      transition={{
        duration: durationMs / 1000,
        delay: delayMs / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingView() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111111] text-slate-800 dark:text-ink-primary flex flex-col selection:bg-[#10B981]/30 selection:text-white transition-colors duration-150">
        {/* ========================================================
            1. Header Navigation: Compact single-row responsive header
            ======================================================== */}
        <header
          ref={headerRef}
          className="px-3.5 sm:px-6 lg:px-12 py-2.5 sm:py-3.5 border-b border-slate-200 dark:border-[#292929] bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-150"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3">
            {/* Left: Brand Identity (Logo, Feather, AI badge, BETA badge) */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 shrink-0 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded-lg"
              >
                <InkloomLogo size="md" showSubtitle={false} />
              </Link>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider dark:bg-[#202020] dark:text-[#FFAA35] dark:border-[#383838] select-none shrink-0">
                BETA
              </span>
            </div>

            {/* Slogan on wider viewports */}
            <span className="hidden lg:inline italic font-serif text-slate-500 dark:text-slate-400 text-xs sm:text-sm select-none">
              A little more clarity in every message.
            </span>

            {/* Desktop Navigation Controls (>= sm):
                Preserves existing desktop order: Create workspace -> Sign In -> ThemeToggle */}
            <div className="hidden sm:flex items-center gap-2.5 md:gap-3 shrink-0">
              {/* 1. Create workspace */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F1F1F] border border-slate-200/80 dark:border-[#383838] transition shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
                >
                  <Building className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>Create workspace</span>
                </Link>
              </motion.div>

              {/* 2. Sign In */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white text-xs font-bold hover:opacity-95 shadow-sm transition inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 dark:focus:ring-offset-[#111111]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </motion.div>

              {/* 3. Theme Toggle */}
              <ThemeToggle className="!w-8 !h-8 !rounded-full bg-white dark:bg-[#1C1C1C] border-slate-300 dark:border-[#383838] shadow-xs shrink-0 flex items-center justify-center" />
            </div>

            {/* Mobile Navigation Controls (< sm):
                Compact single row!
                - Compact Sign In (when screen width permits, e.g. min-[360px])
                - Theme toggle
                - Accessible Hamburger toggle */}
            <div className="flex sm:hidden items-center gap-1.5 xs:gap-2 shrink-0">
              {/* Compact Sign In (hidden on <375px viewports so brand and controls never squeeze) */}
              <motion.div whileTap={{ scale: 0.96 }} className="nav-signin-compact">
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white text-[11px] font-bold shadow-xs inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </Link>
              </motion.div>

              {/* Theme toggle beside navigation controls */}
              <ThemeToggle className="!w-8 !h-8 !rounded-full bg-white dark:bg-[#1C1C1C] border-slate-300 dark:border-[#383838] shadow-xs shrink-0 flex items-center justify-center" />

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-dropdown"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1C1C1C] text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0284C7] transition shrink-0"
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                ) : (
                  <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu (Animated entrance/exit) */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                id="mobile-nav-dropdown"
                aria-label="Mobile navigation"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="sm:hidden overflow-hidden border-t border-slate-100 dark:border-[#262626] mt-2 pt-2.5 pb-1 space-y-2"
              >
                {/* On ultra-narrow viewports (<375px), Sign In is moved here so it is never missing and never duplicated */}
                <div className="nav-menu-signin pb-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white text-xs font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  >
                    <span>Sign In to Inkloom AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Primary Action: Create workspace */}
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#222222] border border-slate-200/80 dark:border-[#333333] transition group focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-[#72D6A1] flex items-center justify-center shrink-0">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#72D6A1] transition">
                        Create workspace
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#888888]">
                        Set up team governance & guidelines
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                </Link>

                {/* Quick in-page link to capabilities */}
                <a
                  href="#what-it-does"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E1E1E] transition text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Product Capabilities</span>
                  </span>
                  <span className="text-[10px] text-slate-400">&darr;</span>
                </a>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        {/* ========================================================
            Main Content Container
            ======================================================== */}
        <main className="flex-1 w-full">
          {/* ========================================================
              2. Hero Section (Centered Dominant Headline & Fluid Viewport Presence)
              ======================================================== */}
          <section className="relative overflow-x-clip min-h-0 md:min-h-[calc(100vh-65px)] flex flex-col justify-center items-center py-8 sm:py-12 md:py-16 lg:py-20">
            {/* Subtle Atmospheric Ambient Glow with Slow Breathing Pulse */}
            <motion.div
              aria-hidden="true"
              animate={{
                opacity: [0.25, 0.4, 0.25],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1020px] h-[450px] pointer-events-none select-none filter blur-[100px] rounded-full bg-gradient-to-tr from-[#10B981]/30 via-[#0284C7]/20 to-[#FFAA35]/30"
            />

            <div className="w-full max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center space-y-5 sm:space-y-7 lg:space-y-8">
              {/* Category Pill with Spring Entrance */}
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-[#1E2724] border border-emerald-200/80 dark:border-[#2B3B36] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-[#72D6A1] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#FFAA35]" />
                  <span>Content Governance & Real-Time Gemini AI</span>
                </div>
              </motion.div>

              {/* Main Headline with Animated Wavy Underline */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-heading font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.1] max-w-5xl mx-auto">
                  <span>Great content. </span>
                  <span className="relative inline-block text-[#059669] dark:text-[#FFAA35]">
                    <span>On brand.</span>
                    {/* Animated SVG Wavy Path */}
                    <svg
                      className="absolute -bottom-1.5 sm:-bottom-3 left-0 w-full h-2.5 sm:h-4 text-[#10B981] dark:text-[#FFAA35] overflow-visible pointer-events-none"
                      viewBox="0 0 160 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <motion.path
                        d="M2 8C20 2 30 13 50 7C70 2 80 13 100 7C120 2 130 13 150 7C154 5.5 158 6 158 6"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.85, delay: 0.45, ease: "easeOut" }}
                      />
                    </svg>
                  </span>{" "}
                  <br className="hidden sm:inline" />
                  <span className="inline-block">Ready for review.</span>
                </h1>
              </motion.div>

              {/* Concise Supporting Sentence */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: "easeOut" }}
              >
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-[#B8B2AC] leading-relaxed max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto">
                  Inkloom AI helps teams create, review, and improve content with brand-aware AI and human approval.
                </p>
              </motion.div>

              {/* Core Pillars Quick Badge Strip (Compact Wrapping Chips on Mobile, 3 Columns on Tablet/Desktop) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.42, ease: "easeOut" }}
                className="pt-1 sm:pt-3"
              >
                <div className="flex flex-wrap items-center justify-center gap-2 sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-5 max-w-4xl lg:max-w-5xl mx-auto">
                  <motion.div
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 sm:p-4.5 rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#282828] shadow-2xs hover:border-[#10B981]/50 dark:hover:border-[#72D6A1]/40 transition cursor-default"
                  >
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Explainable AI checks
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 sm:p-4.5 rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#282828] shadow-2xs hover:border-blue-500/50 dark:hover:border-blue-400/40 transition cursor-default"
                  >
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      People make final calls
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 sm:p-4.5 rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#282828] shadow-2xs hover:border-[#FFAA35]/50 dark:hover:border-[#FFAA35]/40 transition cursor-default"
                  >
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-[#FFAA35] flex items-center justify-center shrink-0">
                      <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Central brand standards
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>

        {/* ========================================================
            3. "What Inkloom AI Does" Section (Scroll Animated)
            ======================================================== */}
        {/* ========================================================
            3. "What Inkloom AI Does" Section (Scroll Animated)
            ======================================================== */}
        <section id="what-it-does" className="py-12 sm:py-20 lg:py-28">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 xl:px-12 space-y-8 sm:space-y-12 lg:space-y-14">
            {/* Section Header */}
            <Reveal className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#1C242C] border border-blue-200 dark:border-[#2A3742] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <Sliders className="w-3.5 h-3.5" />
                <span>What Inkloom AI Does</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                Clear governance for every piece of content
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-[#B8B2AC] leading-relaxed max-w-2xl mx-auto">
                Connect brand guidelines directly to day-to-day creative work with explainable automated checks and transparent review channels.
              </p>
            </Reveal>

            {/* Three Feature Cards with Staggered Entrance (Generous Full-Width Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
              {/* Card 1: Brand-aware content creation */}
              <Reveal delayMs={100} durationMs={550}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-5 sm:p-7 lg:p-8 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2E2E2E] shadow-sm hover:border-[#10B981]/50 dark:hover:border-[#FFAA35]/40 transition space-y-4 sm:space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#72D6A1] border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#72D6A1]">
                        Marketing & Copy
                      </span>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mt-1">
                        Brand-aware content creation
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                      Help marketing teams create and refine messaging that follows approved brand guidelines. Automatically detect voice mismatches, inconsistent terminology, and unverified claims before submitting for review.
                    </p>
                  </div>

                  <ul className="pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-[#262626] space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] dark:text-[#72D6A1] shrink-0" />
                      <span>Brand voice and tone alignment scores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] dark:text-[#72D6A1] shrink-0" />
                      <span>Prohibited terminology and claim alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] dark:text-[#72D6A1] shrink-0" />
                      <span>Actionable replacement suggestions</span>
                    </li>
                  </ul>
                </motion.div>
              </Reveal>

              {/* Card 2: Visual design review */}
              <Reveal delayMs={220} durationMs={550}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-5 sm:p-7 lg:p-8 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2E2E2E] shadow-sm hover:border-[#0284C7]/50 dark:hover:border-blue-400/40 transition space-y-4 sm:space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Design & Assets
                      </span>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mt-1">
                        Visual design review
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                      Help designers evaluate creative assets and identify relevant brand, readability, and accessibility issues where supported. Check approved color palettes, image clearspace, and text contrast.
                    </p>
                  </div>

                  <ul className="pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-[#262626] space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] dark:text-blue-400 shrink-0" />
                      <span>Brand palette adherence evaluation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] dark:text-blue-400 shrink-0" />
                      <span>WCAG color contrast and legibility checks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] dark:text-blue-400 shrink-0" />
                      <span>Logo clearspace and layout guidance</span>
                    </li>
                  </ul>
                </motion.div>
              </Reveal>

              {/* Card 3: Compliance and human approval */}
              <Reveal delayMs={340} durationMs={550}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-5 sm:p-7 lg:p-8 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2E2E2E] shadow-sm hover:border-[#FFAA35]/50 dark:hover:border-[#FFAA35]/40 transition space-y-4 sm:space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-[#FFAA35] border border-amber-200 dark:border-amber-800/40 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#FFAA35]">
                        Compliance & Governance
                      </span>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mt-1">
                        Compliance & human approval
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                      Help teams identify potential content risks, review evidence, and route content to authorized human reviewers. Every decision is recorded with complete audit trails and role-based permissions.
                    </p>
                  </div>

                  <ul className="pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-[#262626] space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFAA35] shrink-0" />
                      <span>Multi-stage role routing (Legal, Brand, Lead)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFAA35] shrink-0" />
                      <span>Complete timestamped decision audit trails</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFAA35] shrink-0" />
                      <span>Human judgment always remains in control</span>
                    </li>
                  </ul>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. "How It Works" Section (Sequential Step Reveal)
            ======================================================== */}
        <section className="py-12 sm:py-20 lg:py-28 bg-slate-50/60 dark:bg-[#141414]/60">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 xl:px-12 space-y-8 sm:space-y-12 lg:space-y-14">
            {/* Section Header */}
            <Reveal className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#1B2722] border border-emerald-200 dark:border-[#263C34] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-[#72D6A1]">
                <Clock className="w-3.5 h-3.5" />
                <span>Three Easy Steps</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                How it works
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                A calm, predictable workflow that lets creators move quickly without risking brand integrity or compliance.
              </p>
            </Reveal>

            {/* Three Step Flow Sequence with Smooth Stagger */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 relative">
              {/* Step 1 */}
              <Reveal delayMs={100} durationMs={550}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-5 sm:p-7 lg:p-8 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2E2E2E] shadow-sm relative flex flex-col justify-between space-y-3.5 sm:space-y-4 hover:border-[#10B981]/40 transition"
                >
                  <div className="space-y-3.5 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xl sm:text-2xl font-heading font-extrabold text-slate-300 dark:text-[#383838]">
                        01
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#252525] text-slate-600 dark:text-slate-400">
                        CREATOR PHASE
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981]/20 to-[#0284C7]/20 text-[#10B981] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        1. Create
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] mt-1.5 leading-relaxed">
                        Start with a campaign brief, marketing draft, or design. Upload text, documents, or creative files directly into your workspace project.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#262626]">
                    Marketing, copywriters, and agency partners
                  </div>
                </motion.div>
              </Reveal>

              {/* Step 2 */}
              <Reveal delayMs={240} durationMs={550}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-5 sm:p-7 lg:p-8 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2E2E2E] shadow-sm relative flex flex-col justify-between space-y-3.5 sm:space-y-4 hover:border-blue-500/40 transition"
                >
                  <div className="space-y-3.5 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xl sm:text-2xl font-heading font-extrabold text-slate-300 dark:text-[#383838]">
                        02
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#252525] text-slate-600 dark:text-slate-400">
                        AI CHECK PHASE
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284C7]/20 to-[#2563EB]/20 text-[#0284C7] flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        2. Review
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] mt-1.5 leading-relaxed">
                        Use available AI checks and relevant brand knowledge to identify tone deviations, prohibited claims, and visual issues with clear explanations.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#262626]">
                    Automated guidelines & brand memory verification
                  </div>
                </motion.div>
              </Reveal>

              {/* Step 3 */}
              <Reveal delayMs={380} durationMs={550}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-5 sm:p-7 lg:p-8 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2E2E2E] shadow-sm relative flex flex-col justify-between space-y-3.5 sm:space-y-4 hover:border-[#FFAA35]/40 transition"
                >
                  <div className="space-y-3.5 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xl sm:text-2xl font-heading font-extrabold text-slate-300 dark:text-[#383838]">
                        03
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#252525] text-slate-600 dark:text-slate-400">
                        APPROVAL PHASE
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFAA35]/20 to-[#FF7A36]/20 text-amber-600 dark:text-[#FFAA35] flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        3. Approve
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] mt-1.5 leading-relaxed">
                        Let the appropriate people review findings, request changes, or approve the content with traceable approval logs and governance assurance.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#262626]">
                    Design leads, legal officers, and brand managers
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. Value & Benefits Section (Smooth Entrance Transitions)
            ======================================================== */}
        <section className="py-12 sm:py-20 lg:py-28">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 xl:px-12 space-y-8 sm:space-y-12 lg:space-y-14">
            {/* Section Header */}
            <Reveal className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-[#201A29] border border-purple-200 dark:border-[#35254A] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Why Teams Choose Inkloom AI</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                Designed for high-trust brand operations
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                Bring clarity and coordination to teams where every published claim, visual, and message counts.
              </p>
            </Reveal>

            {/* 6 Value Cards Grid with Staggered Entrance (Generous Width) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-7">
              {/* Benefit 1 */}
              <Reveal delayMs={60} durationMs={500}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2C2C2C] space-y-2.5 sm:space-y-3 hover:border-[#10B981]/40 transition"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#72D6A1] flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Consistent brand messaging
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                    Keep all campaigns aligned with published brand voice and guidelines across different authors and departments.
                  </p>
                </motion.div>
              </Reveal>

              {/* Benefit 2 */}
              <Reveal delayMs={130} durationMs={500}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2C2C2C] space-y-2.5 sm:space-y-3 hover:border-blue-500/40 transition"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Clear, actionable feedback
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                    Every flagged issue includes specific guideline citations and suggested replacements so creators know how to improve.
                  </p>
                </motion.div>
              </Reveal>

              {/* Benefit 3 */}
              <Reveal delayMs={200} durationMs={500}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2C2C2C] space-y-2.5 sm:space-y-3 hover:border-[#FFAA35]/40 transition"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-[#FFAA35] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Less repetitive manual checking
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                    Catch routine guideline and terminology violations early so reviewers can spend their time on strategic decisions.
                  </p>
                </motion.div>
              </Reveal>

              {/* Benefit 4 */}
              <Reveal delayMs={270} durationMs={500}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2C2C2C] space-y-2.5 sm:space-y-3 hover:border-[#10B981]/40 transition"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-teal-50 dark:bg-[#152B25] text-[#10B981] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Better team coordination
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                    Connect marketing, design, and compliance in one shared workspace instead of scattered chat threads and emails.
                  </p>
                </motion.div>
              </Reveal>

              {/* Benefit 5 */}
              <Reveal delayMs={340} durationMs={500}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2C2C2C] space-y-2.5 sm:space-y-3 hover:border-purple-500/40 transition"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Traceable review decisions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                    Maintain historical audit logs of revisions, review notes, and final sign-offs for accountability and governance.
                  </p>
                </motion.div>
              </Reveal>

              {/* Benefit 6 */}
              <Reveal delayMs={410} durationMs={500}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="h-full p-4.5 sm:p-6 lg:p-7 rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2C2C2C] space-y-2.5 sm:space-y-3 hover:border-rose-500/40 transition"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Human control over final approval
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B2AC] leading-relaxed">
                    AI provides intelligent pre-checks, but human reviewers always hold the authority to approve, reject, or override.
                  </p>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ========================================================
            6. Final Call to Action Section (Smooth Entrance Transition)
            ======================================================== */}
        <section className="py-12 sm:py-20 lg:py-28">
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 xl:px-12">
            <Reveal durationMs={650} yOffset={24}>
              <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-[#10B981] via-[#0D9488] to-[#0284C7] dark:from-[#1C1C1C] dark:to-[#141414] text-white border border-white/20 dark:border-[#333333] shadow-2xl relative overflow-hidden text-center space-y-5 sm:space-y-6">
                {/* Background ambient accents */}
                <div
                  aria-hidden="true"
                  className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 dark:bg-[#FFAA35]/10 filter blur-3xl pointer-events-none"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#0284C7]/30 dark:bg-[#10B981]/10 filter blur-3xl pointer-events-none"
                />

                <div className="relative z-10 max-w-2xl mx-auto space-y-3.5 sm:space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-[#272727] border border-white/30 dark:border-[#3E3E3E] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white dark:text-[#FFAA35]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Get Started With Inkloom AI</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight leading-tight">
                    Bring your team&rsquo;s content into one clearer workflow.
                  </h2>

                  <p className="text-xs sm:text-sm text-white/90 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                    Create a dedicated workspace for your brand guidelines, campaign drafts, and review pipelines, or sign in to your existing team account.
                  </p>

                  {/* Final Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 sm:pt-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                      <Link
                        href="/register"
                        className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <Building className="w-4 h-4 text-[#10B981]" />
                        <span>Create a workspace</span>
                      </Link>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                      <Link
                        href="/login"
                        className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-white/15 dark:bg-[#252525] hover:bg-white/25 dark:hover:bg-[#2F2F2F] text-white font-semibold text-xs sm:text-sm border border-white/30 dark:border-[#404040] backdrop-blur-md transition inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <span>Sign in to existing workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  </div>

                  <div className="pt-2 text-[10.5px] sm:text-[11px] text-white/80 dark:text-slate-400">
                    Role-based permissions • Complete audit trails • Tenant zero-trust data isolation
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ========================================================
          7. Footer
          ======================================================== */}
      <footer className="px-5 sm:px-6 lg:px-12 py-6 sm:py-8 border-t border-slate-200 dark:border-[#222222] bg-white dark:bg-[#111111] text-xs text-slate-500 dark:text-[#85817D] transition-colors duration-150">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <InkloomLogo size="sm" showSubtitle={false} />
            <span className="text-slate-400 dark:text-[#444444]">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px]">Tenant Zero-Trust Isolation Active</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition py-1">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white transition py-1">
              Create Workspace
            </Link>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition py-1">
              Explore Demo
            </Link>
          </div>

          <div className="text-[11px] text-center md:text-right">
            Inkloom AI Brand Governance &copy; 2026. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  </MotionConfig>
  );
}
