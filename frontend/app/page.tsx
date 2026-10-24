"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";
import { ContentSubmission, AnalyticsSummary, MemberInfo } from "@/types";
import { LandingView } from "@/components/auth/LandingView";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { DesignerDashboard } from "@/components/dashboards/DesignerDashboard";
import { LegalDashboard } from "@/components/dashboards/LegalDashboard";
import { MarketingDashboard } from "@/components/dashboards/MarketingDashboard";

export default function DashboardPage() {
  const { isAuthenticated, activeRole, activeOrgId } = useAuth();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      const [subs, stats] = await Promise.all([
        api.getSubmissions(),
        api.getAnalyticsSummary(),
      ]);
      setSubmissions(subs);
      setAnalytics(stats);

      if (activeOrgId) {
        const mems = await api.getMembers(activeOrgId).catch(() => []);
        setMembers(mems);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, activeOrgId, activeRole]);

  // Public Landing Page if user is not logged in
  if (!isAuthenticated) {
    return <LandingView />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading workspace dashboard...</p>
      </div>
    );
  }

  // Role-Specific Dashboards
  if (activeRole === "designer") {
    return <DesignerDashboard submissions={submissions} onRefresh={loadData} />;
  }

  if (activeRole === "compliance_officer" || activeRole === "reviewer") {
    return <LegalDashboard submissions={submissions} onRefresh={loadData} />;
  }

  if (activeRole === "marketing" || activeRole === "creator") {
    return <MarketingDashboard submissions={submissions} onRefresh={loadData} />;
  }

  // Default: Manager / Administrator
  return (
    <ManagerDashboard
      submissions={submissions}
      analytics={analytics}
      members={members}
      onRefresh={loadData}
    />
  );
}
