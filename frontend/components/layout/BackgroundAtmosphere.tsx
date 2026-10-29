"use client";

import React from "react";

interface BackgroundAtmosphereProps {
  variant?: "hero" | "split-auth" | "subtle" | "workspace";
  className?: string;
}

export function BackgroundAtmosphere({
  variant = "subtle",
  className = "",
}: BackgroundAtmosphereProps) {
  if (variant === "split-auth") {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        {/* ========================================================
            LIGHT MODE: Mint-to-Turquoise Atmospheric Background
            ======================================================== */}
        <div className="absolute inset-0 dark:hidden">
          {/* Base Atmospheric Gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(125deg, #D8F7E9 0%, #A5EBDD 35%, #58D9D0 72%, #10A995 100%)",
            }}
          />

          {/* Large flowing diagonal mint-turquoise curved glow */}
          <div
            className="absolute -top-32 -left-20 w-[680px] h-[360px] rounded-full opacity-50 filter blur-[80px] rotate-[-22deg]"
            style={{
              background:
                "linear-gradient(110deg, #D9F8EF 0%, #A5EBDD 30%, #43D6B3 65%, #10A995 100%)",
            }}
          />

          {/* Secondary softer bottom-right turquoise glow */}
          <div
            className="absolute -bottom-24 -right-16 w-[540px] h-[320px] rounded-full opacity-40 filter blur-[75px] rotate-[15deg]"
            style={{
              background:
                "linear-gradient(130deg, #58D9D0 0%, #43D6B3 50%, #087F70 100%)",
            }}
          />

          {/* Fine orbital rings */}
          <div className="absolute top-1/4 left-8 w-[420px] h-[420px] rounded-full border border-white/40" />
          <div className="absolute top-1/4 left-24 w-[320px] h-[320px] rounded-full border border-[#087F70]/20" />
          <div className="absolute top-1/3 left-40 w-[200px] h-[200px] rounded-full border border-[#10A995]/25" />

          {/* Minimal star sparkle accents */}
          <svg
            className="absolute top-28 left-1/3 w-4 h-4 text-white opacity-85 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
          <svg
            className="absolute top-2/3 left-16 w-3 h-3 text-[#087F70] opacity-70"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
          <svg
            className="absolute bottom-20 left-2/3 w-3.5 h-3.5 text-white opacity-60"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* ========================================================
            DARK MODE: Preserved 100% Pixel-Identical Deep Warm Mesh
            ======================================================== */}
        <div className="absolute inset-0 hidden dark:block">
          <div className="absolute inset-0 bg-[#111111]" />

          {/* Large flowing diagonal warm ribbon */}
          <div
            className="absolute -top-32 -left-20 w-[680px] h-[340px] rounded-full opacity-60 filter blur-[90px] rotate-[-22deg]"
            style={{
              background:
                "linear-gradient(110deg, #FFD84D 0%, #FFAA35 28%, #FF7A36 55%, #FF665C 75%, #F45B91 100%)",
            }}
          />

          {/* Secondary softer bottom-right coral/pink glow */}
          <div
            className="absolute -bottom-24 -right-16 w-[520px] h-[300px] rounded-full opacity-45 filter blur-[80px] rotate-[15deg]"
            style={{
              background:
                "linear-gradient(130deg, #FF7A36 0%, #FF665C 50%, #F45B91 100%)",
            }}
          />

          {/* Fine orbital rings */}
          <div className="absolute top-1/4 left-8 w-[420px] h-[420px] rounded-full border border-white/[0.04]" />
          <div className="absolute top-1/4 left-24 w-[320px] h-[320px] rounded-full border border-[#FFAA35]/[0.08]" />
          <div className="absolute top-1/3 left-40 w-[200px] h-[200px] rounded-full border border-[#FF7A36]/[0.06]" />

          {/* Minimal star sparkle accents */}
          <svg
            className="absolute top-28 left-1/3 w-4 h-4 text-[#FFD84D] opacity-60 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
          <svg
            className="absolute top-2/3 left-16 w-3 h-3 text-[#FFAA35] opacity-50"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
          <svg
            className="absolute bottom-20 left-2/3 w-3.5 h-3.5 text-[#F6A6C4] opacity-40"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        {/* LIGHT MODE HERO ATMOSPHERE */}
        <div className="absolute inset-0 dark:hidden">
          <div
            className="absolute -top-28 right-0 w-[640px] md:w-[820px] h-[280px] rounded-full opacity-45 filter blur-[75px] rotate-[-16deg]"
            style={{
              background:
                "linear-gradient(125deg, #D8F7E9 0%, #A5EBDD 35%, #58D9D0 72%, #10A995 100%)",
            }}
          />
          <div
            className="absolute top-10 left-1/4 w-[360px] h-[180px] rounded-full opacity-30 filter blur-[60px]"
            style={{
              background: "radial-gradient(circle, #43D6B3 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-8 right-12 w-[340px] h-[340px] rounded-full border border-[#087F70]/15" />
          <div className="absolute top-16 right-20 w-[240px] h-[240px] rounded-full border border-[#10A995]/20" />
          <svg
            className="absolute top-12 right-1/4 w-3.5 h-3.5 text-[#087F70] opacity-70 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* DARK MODE HERO ATMOSPHERE (Untouched) */}
        <div className="absolute inset-0 hidden dark:block">
          <div
            className="absolute -top-28 right-0 w-[640px] md:w-[820px] h-[260px] rounded-full opacity-40 filter blur-[75px] rotate-[-16deg]"
            style={{
              background:
                "linear-gradient(110deg, #FFD84D 0%, #FFAA35 25%, #FF7A36 50%, #FF665C 75%, #F45B91 100%)",
            }}
          />
          <div
            className="absolute top-10 left-1/4 w-[360px] h-[180px] rounded-full opacity-20 filter blur-[60px]"
            style={{
              background: "radial-gradient(circle, #FFAA35 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-8 right-12 w-[340px] h-[340px] rounded-full border border-[#FFAA35]/[0.08]" />
          <div className="absolute top-16 right-20 w-[240px] h-[240px] rounded-full border border-white/[0.04]" />
          <svg
            className="absolute top-12 right-1/4 w-3.5 h-3.5 text-[#FFD84D] opacity-70 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>
      </div>
    );
  }

  // Default subtle workspace ambient atmosphere
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Light Mode Subtle Atmosphere */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[220px] rounded-full opacity-25 filter blur-[90px] dark:hidden"
        style={{
          background:
            "linear-gradient(125deg, #D8F7E9 0%, #A5EBDD 50%, #58D9D0 100%)",
        }}
      />

      {/* Dark Mode Subtle Atmosphere (Untouched) */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[200px] rounded-full opacity-15 filter blur-[90px] hidden dark:block"
        style={{
          background:
            "linear-gradient(110deg, #FFD84D 0%, #FF7A36 50%, #F45B91 100%)",
        }}
      />
    </div>
  );
}
