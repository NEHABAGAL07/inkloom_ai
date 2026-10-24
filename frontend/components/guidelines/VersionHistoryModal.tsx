"use client";

import React, { useEffect, useState } from "react";
import { BrandGuidelineVersionInfo } from "@/types";
import { api } from "@/services/api";
import { X, History, RotateCcw, Clock, Check, User, AlertCircle } from "lucide-react";

interface VersionHistoryModalProps {
  currentVersion: string;
  onClose: () => void;
  onRestore: (versionId: string) => Promise<void>;
}

export function VersionHistoryModal({
  currentVersion,
  onClose,
  onRestore,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<BrandGuidelineVersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getGuidelineVersions();
        setVersions(list);
      } catch (err: any) {
        setError(err?.message || "Failed to load version history.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRestore = async (v: BrandGuidelineVersionInfo) => {
    if (
      !confirm(
        `Are you sure you want to restore Version ${v.version}? This will load its full snapshot into your working draft.`
      )
    ) {
      return;
    }

    setRestoringId(v.id);
    setError(null);
    try {
      await onRestore(v.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to restore version.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 shadow-xl relative text-ink-primary max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-navy transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
          <History className="w-4 h-4" />
          <span>Audit Trail &amp; Version History</span>
        </div>
        <h2 className="text-xl font-extrabold text-navy tracking-tight">Published Guideline Versions</h2>
        <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
          Every publication generates an immutable snapshot. Authorized managers can inspect past standards and roll back working drafts.
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-ink-muted">Loading version history...</div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center bg-workspace rounded-xl border border-border text-xs text-ink-muted">
              No previous versions found.
            </div>
          ) : (
            versions.map((v) => {
              const isCurrent = v.version === currentVersion;
              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-xl border transition ${
                    isCurrent
                      ? "bg-teal/5 border-teal shadow-subtle"
                      : "bg-surface border-border hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-navy">v{v.version}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-status-success">
                            Currently Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ink-muted" />
                          {new Date(v.published_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-ink-muted" />
                          {v.published_by}
                        </span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRestore(v)}
                        disabled={restoringId === v.id}
                        className="px-3 py-1.5 bg-workspace hover:bg-slate-200 border border-border text-navy text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-teal" />
                        <span>{restoringId === v.id ? "Restoring..." : "Restore Draft"}</span>
                      </button>
                    )}
                  </div>

                  {v.changelog && (
                    <div className="mt-2.5 pt-2.5 border-t border-border text-xs text-ink-secondary">
                      <span className="font-bold text-navy text-[11px] uppercase tracking-wider block mb-0.5">
                        Changelog
                      </span>
                      <p className="line-clamp-2 leading-relaxed">{v.changelog}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-border mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-workspace hover:bg-slate-200 text-ink-secondary text-xs font-semibold rounded-xl border border-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
