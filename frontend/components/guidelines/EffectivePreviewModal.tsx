"use client";

import React, { useState, useEffect } from "react";
import { EffectiveSettings } from "@/types";
import { api } from "@/services/api";
import { X, Sliders, CheckCircle, AlertTriangle, Layers, ArrowRight } from "lucide-react";

interface EffectivePreviewModalProps {
  onClose: () => void;
}

export function EffectivePreviewModal({ onClose }: EffectivePreviewModalProps) {
  const [mediaType, setMediaType] = useState("social_media");
  const [data, setData] = useState<EffectiveSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEffective() {
      setLoading(true);
      try {
        const res = await api.getEffectiveSettings(mediaType);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchEffective();
  }, [mediaType]);

  const mediaOptions = [
    { id: "social_media", name: "Social Media Graphics & Posters" },
    { id: "photography", name: "Photography & Commercial Imagery" },
    { id: "video", name: "Video & Motion Graphics" },
    { id: "print", name: "Print Media & Booth Graphics" },
    { id: "web_ads", name: "Website & Digital Advertisements" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-slate-200 max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sliders className="w-4 h-4" />
          <span>Inheritance &amp; Override Engine</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Preview Effective Media Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          General Brand Guidelines are the default source of truth. Media-specific sections inherit those defaults unless explicitly overridden by an authorized manager.
        </p>

        {/* Media Selector Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          {mediaOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMediaType(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mediaType === opt.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>

        {/* Content View */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Calculating effective rules...</div>
          ) : !data ? (
            <div className="p-8 text-center text-xs text-slate-500">No data available</div>
          ) : (
            <>
              {/* Conflicts Banner */}
              {data.conflicts && data.conflicts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Rule Conflict Detected!</span>
                  </div>
                  {data.conflicts.map((c, i) => (
                    <p key={i} className="text-[11px] pl-6 leading-relaxed">
                      {c.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Resolved Settings List */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Configuration Key
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Effective Value &amp; Source
                  </span>
                </div>

                {Object.entries(data.effective_settings).map(([key, val]) => {
                  const isInherited = data.inherited_keys.includes(key);
                  const isOverridden = data.overridden_keys.includes(key);

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40 last:border-b-0"
                    >
                      <span className="font-mono text-slate-300 font-medium">
                        {key.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-2 text-right">
                        <span className="font-semibold text-white truncate max-w-xs">
                          {typeof val === "object" ? JSON.stringify(val) : String(val)}
                        </span>
                        {isInherited && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-400 border border-slate-700">
                            Inherited
                          </span>
                        )}
                        {isOverridden && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            Overridden
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scope Notes */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Governance Engine Note</div>
                <p>
                  The AI Audit Engine analyzes assets against both the General Brand source of truth and the specific placement rules above. Overrides take precedence for layout and dimensions, but cannot relax mandatory legal compliance or accessibility minimums.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
