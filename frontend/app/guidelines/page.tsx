"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import BrandGuidelinesPage from "../settings/page";

export default function GuidelinesRoute() {
  const { activeRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (activeRole === "designer") {
      router.replace("/media-audit?tab=guidelines");
    }
  }, [activeRole, router]);

  if (activeRole === "designer") {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-ink-muted">
          Opening Media Audit &amp; Guidelines...
        </p>
      </div>
    );
  }

  return <BrandGuidelinesPage />;
}
