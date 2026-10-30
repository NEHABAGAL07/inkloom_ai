"use client";

import React from "react";

interface InkloomLogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
  showSubtitle?: boolean;
  showWordmark?: boolean;
}

export function InkloomLogo({
  size = "md",
  showBadge = true,
  className = "",
  showSubtitle = false,
  showWordmark = true,
}: InkloomLogoProps) {
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  }[size];

  const textDimensions = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  return (
    <div className={`flex items-center ${showWordmark ? "gap-3" : "justify-center"} select-none ${className}`}>
      {/* Feather Symbol Container */}
      <div
        className={`${iconDimensions} relative rounded-xl bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] flex items-center justify-center shadow-subtle hover:border-[#10A995] dark:hover:border-[#FF7A36]/40 transition-colors duration-200 overflow-hidden shrink-0`}
      >
        {/* Glow background inside the logo badge */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#E8F7F1] via-[#D9F8EF] to-[#A5EBDD]/40 dark:from-[#9333EA]/20 dark:via-[#FF7A36]/20 dark:to-[#FFD84D]/25 opacity-90" />

        {/* Cute Inkloom Feather Logo Asset */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/inkloom-feather-cute@2x.png"
          alt="Inkloom AI Feather"
          className="w-[62%] h-[62%] relative z-10 object-contain transition-transform duration-200 group-hover:scale-110 filter drop-shadow-[0_1px_4px_rgba(168,85,247,0.45)] select-none pointer-events-none"
        />
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textDimensions} font-heading font-extrabold text-[#18352F] dark:text-[#F7F3ED] tracking-tight`}
            >
              Inkloom
            </span>
            {showBadge && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFD84D]/15 dark:via-[#FF7A36]/20 dark:to-[#F45B91]/15 dark:text-[#FFAA35] dark:border-[#FF7A36]/40 uppercase tracking-widest shadow-sm">
                AI
              </span>
            )}
          </div>
          {showSubtitle && (
            <span className="text-[11px] text-[#58716A] dark:text-[#85817D] font-medium tracking-wide mt-1">
              Brand Governance Co-Pilot
            </span>
          )}
        </div>
      )}
    </div>
  );
}
