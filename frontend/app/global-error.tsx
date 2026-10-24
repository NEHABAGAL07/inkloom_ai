"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Inkloom AI Global Error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen font-sans flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-white">
              Application Initialization Error
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected error occurred during root application layout rendering.
            </p>
            {error?.message && (
              <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-left">
                <p className="font-mono text-[11px] text-slate-400 break-words line-clamp-3">
                  {error.message}
                </p>
              </div>
            )}
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
