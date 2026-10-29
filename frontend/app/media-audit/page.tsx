"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";
import { ContentSubmission } from "@/types";
import { MediaAuditView } from "@/components/dashboards/MediaAuditView";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function MediaAuditPage() {
  const router = useRouter();
  const { isAuthenticated, activeRole } = useAuth();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subs = await api.getSubmissions();
      setSubmissions(subs || []);
    } catch (e: any) {
      console.error("Media audit submissions load failure:", e);
      setError(e?.message || "Unable to load media submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadData();
  }, [isAuthenticated, router, loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin"></div>
        <p className="text-xs text-ink-secondary font-medium">Loading Media Audit Studio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-surface border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Media Audit Load Error</h2>
            <p className="text-xs text-ink-secondary mt-1">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <MediaAuditView submissions={submissions} onRefresh={loadData} />
    </div>
  );
}
