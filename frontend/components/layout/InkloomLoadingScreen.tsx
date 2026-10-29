"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface InkloomLoadingScreenProps {
  progress?: number;
  onRetry?: () => Promise<void> | void;
  showSlowWarning?: boolean;
}

export function InkloomLoadingScreen({
  progress,
  onRetry,
  showSlowWarning = false,
}: InkloomLoadingScreenProps) {
  // If progress is not explicitly passed from caller, simulate a smooth natural progression (15% -> 26% -> 68% -> 90%)
  const [internalProgress, setInternalProgress] = useState<number>(15);

  useEffect(() => {
    if (typeof progress === "number") return;

    // Fast initial step to 26% (matches exact reference screenshot progress state)
    const t1 = setTimeout(() => setInternalProgress(26), 180);
    const t2 = setTimeout(() => setInternalProgress(42), 650);
    const t3 = setTimeout(() => setInternalProgress(68), 1200);
    const t4 = setTimeout(() => setInternalProgress(84), 2100);
    const t5 = setTimeout(() => setInternalProgress(92), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [progress]);

  const currentProgress = typeof progress === "number"
    ? Math.min(100, Math.max(0, progress))
    : internalProgress;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-[#FAFCFB] dark:bg-[#11100F] text-[#18352F] dark:text-[#F7F3ED] select-none transition-colors duration-200"
      role="status"
      aria-live="polite"
      aria-label="Loading Inkloom AI"
    >
      {/* Centered Composition Group */}
      <div className="flex flex-col items-center justify-center px-4">
        {/* Logo and Orbital Assembly (110px) */}
        <div className="relative w-[110px] h-[110px] flex items-center justify-center">
          {/* Subtle Ambient Radial Glow Behind Logo */}
          <div
            className="absolute -inset-6 rounded-full pointer-events-none blur-xl bg-[radial-gradient(circle_at_center,rgba(88,217,208,0.18)_0%,rgba(57,150,216,0.06)_50%,transparent_75%)] dark:hidden"
            aria-hidden="true"
          />
          <div
            className="absolute -inset-6 rounded-full pointer-events-none blur-xl hidden dark:block bg-[radial-gradient(circle_at_center,rgba(255,216,77,0.15)_0%,rgba(255,122,54,0.06)_50%,transparent_75%)]"
            aria-hidden="true"
          />

          {/* Rotating Orbital Arcs (110x110) */}
          <div className="absolute inset-0 pointer-events-none animate-orbital-spin motion-reduce:animate-none">
            <svg
              width="110"
              height="110"
              viewBox="0 0 110 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                {/* Light Mode Arcs Gradient: #3996D8 -> #20B9C0 -> #55CDB7 */}
                <linearGradient id="orbitalArcLight" x1="10" y1="10" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3996D8" />
                  <stop offset="50%" stopColor="#20B9C0" />
                  <stop offset="100%" stopColor="#55CDB7" />
                </linearGradient>

                {/* Dark Mode Arcs Gradient: #FFD84D -> #FFAA35 -> #FF7A36 */}
                <linearGradient id="orbitalArcDark" x1="10" y1="10" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD84D" />
                  <stop offset="50%" stopColor="#FFAA35" />
                  <stop offset="100%" stopColor="#FF7A36" />
                </linearGradient>
              </defs>

              {/* Light Mode Orbital Arcs (thin circular strokes with gaps & soft glow) */}
              <g className="dark:hidden">
                <circle
                  cx="55"
                  cy="55"
                  r="49"
                  stroke="url(#orbitalArcLight)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeDasharray="126 28 126 28"
                  style={{ filter: "drop-shadow(0 0 6px rgba(32, 185, 192, 0.40))" }}
                />
              </g>

              {/* Dark Mode Orbital Arcs (glowing golden circular strokes with gaps & controlled glow) */}
              <g className="hidden dark:block">
                <circle
                  cx="55"
                  cy="55"
                  r="49"
                  stroke="url(#orbitalArcDark)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeDasharray="126 28 126 28"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255, 170, 53, 0.50))" }}
                />
              </g>
            </svg>
          </div>

          {/* Central Inkloom AI Cute Feather Logo (Exact Feather Asset from user reference) */}
          <div className="relative z-10 w-[72px] h-[72px] flex items-center justify-center pointer-events-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/inkloom-feather-cute@2x.png"
              alt="Inkloom AI Feather Logo"
              width={54}
              height={72}
              className="w-[52px] h-[68px] object-contain select-none pointer-events-none filter drop-shadow-[0_2px_12px_rgba(124,58,237,0.35)] dark:drop-shadow-[0_0_18px_rgba(216,74,235,0.75)]"
            />
          </div>
        </div>

        {/* Brand Name (Top margin: ~30px, letter spacing ~5px, uppercase, medium font weight) */}
        <h1
          className="mt-[30px] text-[13px] sm:text-[14px] font-medium uppercase font-heading text-[#538D8A] dark:text-[#FFD84D] tracking-[5px] select-none text-center"
          style={{ letterSpacing: "5px" }}
        >
          INKLOOM AI
        </h1>

        {/* Progress Bar (Top margin: ~32px, Width: min(350px, 72vw), Height: ~9px, Rounded) */}
        <div
          className="mt-[32px] w-[350px] max-w-[72vw] h-[9px] rounded-full overflow-hidden bg-[#E4E9E7] dark:bg-[#49443A] shadow-inner"
          role="progressbar"
          aria-valuenow={Math.round(currentProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-[#48C9B8] to-[#219ED3] dark:from-[#FFD84D] dark:via-[#FFAA35] dark:to-[#FF7A36]"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Percentage Label (Top margin: ~14px, Centered, Small readable typography) */}
        <div className="mt-[14px] text-xs font-medium text-[#777F7D] dark:text-[#E6D8B8] font-mono select-none text-center">
          {Math.round(currentProgress)}%
        </div>

        {/* Slow Initialization Warning / Retry Action */}
        {showSlowWarning && (
          <div className="mt-8 flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <p className="text-[11px] text-[#777F7D] dark:text-[#85817D]">
              Initialization is taking longer than expected.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry()}
                className="px-3 py-1.5 rounded-lg border border-[#DDEBE5] dark:border-[#383838] bg-white dark:bg-[#1C1C1C] text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] hover:bg-[#F7FBF9] dark:hover:bg-[#272727] transition flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3 h-3 text-[#10A995] dark:text-[#FFAA35]" />
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
