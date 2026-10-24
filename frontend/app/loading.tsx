import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 p-6">
      <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-subtle border border-border animate-pulse">
        <span className="text-lg font-black text-white">I</span>
      </div>
      <p className="text-[11px] text-ink-secondary tracking-wider font-semibold uppercase animate-pulse">
        Loading Inkloom Brand Governance...
      </p>
    </div>
  );
}
