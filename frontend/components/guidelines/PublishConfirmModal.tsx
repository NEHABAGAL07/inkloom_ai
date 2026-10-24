"use client";

import React, { useState } from "react";
import { BrandGuidelineData } from "@/types";
import { X, CheckCircle, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";

interface PublishConfirmModalProps {
  currentVersion: string;
  draftData: BrandGuidelineData;
  onClose: () => void;
  onPublish: (version: string, changelog: string) => Promise<void>;
}

export function PublishConfirmModal({
  currentVersion,
  draftData,
  onClose,
  onPublish,
}: PublishConfirmModalProps) {
  // Suggest next minor version
  const suggestNextVersion = (ver: string) => {
    const parts = ver.split(".");
    if (parts.length === 3 && !isNaN(Number(parts[1]))) {
      return `${parts[0]}.${Number(parts[1]) + 1}.0`;
    }
    return `${ver}-pub`;
  };

  const [version, setVersion] = useState(suggestNextVersion(currentVersion));
  const [changelog, setChangelog] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation checks
  const checks = [
    {
      title: "Official Brand Name Defined",
      valid: Boolean(draftData.identity?.brand_name?.trim()),
      required: true,
    },
    {
      title: "Primary Color Configured",
      valid: Boolean(
        draftData.colors?.palette?.some((c) => c.role === "primary" && c.hex)
      ),
      required: true,
    },
    {
      title: "Primary Font Hierarchy Specified",
      valid: Boolean(draftData.typography?.primary_font?.trim()),
      required: true,
    },
    {
      title: "Brand Tone & Voice Pillars Established",
      valid: Boolean(draftData.voice?.brand_tone?.length > 0),
      required: true,
    },
    {
      title: "Mandatory Compliance Disclaimers Set",
      valid: Boolean(draftData.compliance?.length > 0),
      required: false,
    },
  ];

  const allRequiredValid = checks.filter((c) => c.required).every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !allRequiredValid) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onPublish(version.trim(), changelog.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to publish guidelines. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Governance Publication Flow</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">Publish Brand Guidelines</h2>
        <p className="text-xs text-slate-400 mt-1">
          Publishing creates an immutable version snapshot, makes standards visible to employees, and supplies the new rules to the AI audit engine.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Pre-flight Validation Checklist */}
        <div className="mt-5 bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Publication Readiness Checklist
          </div>
          {checks.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className={c.valid ? "text-slate-200" : "text-slate-400"}>
                {c.title} {c.required && <span className="text-rose-400">*</span>}
              </span>
              {c.valid ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {c.required ? "Required" : "Optional"}
                </span>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Version
              </label>
              <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
                v{currentVersion}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Published Version <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 2026.2.0"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Release Notes / Summary of Changes
            </label>
            <textarea
              rows={3}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="e.g. Updated primary color contrast rules, refined anti-FUD messaging policies, added LinkedIn banner placement specifications..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !allRequiredValid || !version.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? "Publishing..." : "Confirm & Publish"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
