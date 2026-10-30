"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
import { ThemeToggle } from "@/services/theme-context";
import { InkloomLogo } from "@/components/layout/InkloomLogo";
import {
  Shield,
  Building,
  UserCheck,
  ArrowRight,
  AlertCircle,
  FileCheck2,
  Sparkles,
  Palette,
  ExternalLink,
  Lock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface DemoPersona {
  id: string;
  name: string;
  email: string;
  orgName: string;
  role: string;
  roleLabel: string;
  badgeColor: string;
  description: string;
  keyResponsibilities: string[];
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "admin",
    name: "Alex Mercer",
    email: "admin@acmecloud.com",
    orgName: "Acme Cloud",
    role: "admin",
    roleLabel: "Brand Administrator",
    badgeColor: "bg-navy/10 text-navy border-navy/20",
    description: "Executive brand director managing global standards, team memberships, and audit logs.",
    keyResponsibilities: [
      "Brand Guidelines Administration",
      "Team Member & Role Management",
      "Audit Engine Rule Configuration",
      "Enterprise System Settings",
    ],
  },
  {
    id: "compliance",
    name: "Elena Rostova",
    email: "compliance@acmecloud.com",
    orgName: "Acme Cloud",
    role: "compliance_officer",
    roleLabel: "Legal & Regulatory Officer",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Legal counsel enforcing FTC, SEC, and global regulatory rules prior to public content release.",
    keyResponsibilities: [
      "Pre-Publication Review Queue",
      "Substantiation Evidence Verification",
      "Mandatory Legal Disclaimers",
      "Authorized Human Sign-off",
    ],
  },
  {
    id: "marketing",
    name: "Maya Lin",
    email: "marketing@acmecloud.com",
    orgName: "Acme Cloud",
    role: "marketing",
    roleLabel: "Marketing Content Creator",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Content strategist submitting marketing copy, campaign headlines, and press materials for review.",
    keyResponsibilities: [
      "New Content Submission",
      "Real-time AI Pre-Flight Audit",
      "Risk Score & Severity Breakdown",
      "Revision & Resubmission Flow",
    ],
  },
  {
    id: "designer",
    name: "Leo Vance",
    email: "designer@acmecloud.com",
    orgName: "Acme Cloud",
    role: "designer",
    roleLabel: "Senior Brand Designer",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    description: "Visual identity lead auditing typography, color contrast, logo exclusion zones, and media assets.",
    keyResponsibilities: [
      "Visual Identity Standards",
      "Logo Clear-space Inspection",
      "Hex & Palette Token Checks",
      "Media Asset Audit Service",
    ],
  },
  {
    id: "lumina",
    name: "Dr. Rachel Hayes",
    email: "rachel.hayes@luminabio.com",
    orgName: "Lumina BioHealth",
    role: "admin",
    roleLabel: "Life Sciences Brand Director",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Demonstrating strict multi-tenant isolation with healthcare compliance rules and separate assets.",
    keyResponsibilities: [
      "Tenant Isolation Demonstration",
      "Life Sciences Compliance Guardrails",
      "Clinical Evidence Verification",
      "Isolated Organization Data",
    ],
  },
];

export default function DemoSandboxPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [activeSubmitting, setActiveSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoSignIn = async (persona: DemoPersona) => {
    setActiveSubmitting(persona.id);
    setError(null);

    try {
      try {
        await login(persona.email, "password123");
      } catch {
        await login(persona.email, "demo123456");
      }
      router.push("/");
    } catch (err: any) {
      setError(
        err?.message ||
          `Failed to authenticate as ${persona.name}. Verify the backend database is initialized.`
      );
      setActiveSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] dark:bg-[#111111] text-[#18352F] dark:text-[#F7F3ED] py-8 sm:py-12 px-4 sm:px-6 relative transition-colors duration-150">
      <div className="max-w-5xl mx-auto">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#DDEBE5] dark:border-[#383838]">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F1F1F] border border-slate-200/80 dark:border-[#383838] transition shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Back to home</span>
            </Link>
            <Link href="/" className="inline-flex items-center gap-2">
              <InkloomLogo size="md" showSubtitle={false} />
            </Link>
          </div>
          <ThemeToggle />
        </div>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F7F1] dark:bg-amber-500/10 border border-[#C8E2D8] dark:border-amber-500/20 text-[#087F70] dark:text-[#FFAA35] text-xs font-bold mb-3 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon &amp; Evaluation Sandbox</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18352F] dark:text-[#F7F3ED] font-heading sm:text-4xl">
            Role-Based Evaluation Access
          </h1>
          <p className="text-sm text-[#58716A] dark:text-[#85817D] mt-2 max-w-2xl mx-auto leading-relaxed">
            Test Inkloom AI&apos;s role-based access control (RBAC), multi-tenant isolation, and pre-publication compliance workflows using pre-configured evaluation accounts.
          </p>
        </div>

        {/* Notice Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] text-[#58716A] dark:text-[#85817D] flex items-start gap-3 text-xs leading-relaxed shadow-sm dark:shadow-xl">
          <AlertCircle className="w-4 h-4 text-[#087F70] dark:text-[#FFAA35] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#18352F] dark:text-[#F7F3ED]">Evaluation Sandbox Notice:</span> Each button triggers a legitimate backend authentication request (
            <code className="bg-[#EFF8F4] dark:bg-[#141414] text-[#087F70] dark:text-[#FFAA35] border border-[#DDEBE5] dark:border-[#383838] px-1.5 py-0.5 rounded font-mono text-[11px]">POST /api/v1/auth/login</code>
            ) verifying user credentials, issuing an HttpOnly session cookie, and loading tenant-scoped data.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold">Authentication Notice</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_PERSONAS.map((persona) => {
            const isSubmitting = activeSubmitting === persona.id;

            return (
              <div
                key={persona.id}
                className="bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] hover:border-[#10A995] dark:hover:border-amber-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FF7A36] dark:via-[#FFAA35] dark:to-[#FFD84D]" />
                <div>
                  {/* Top Role & Org Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-[#E8F7F1] dark:bg-amber-500/10 text-[#087F70] dark:text-[#FFAA35] border-[#C8E2D8] dark:border-amber-500/20 font-mono"
                    >
                      {persona.roleLabel}
                    </span>
                    <span className="text-[11px] font-medium text-[#58716A] dark:text-[#85817D] flex items-center gap-1 font-mono">
                      <Building className="w-3 h-3 text-[#087F70] dark:text-[#FFAA35]" />
                      {persona.orgName}
                    </span>
                  </div>

                  {/* Persona Identity */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading">{persona.name}</h3>
                    <p className="text-xs font-mono text-[#82948E] dark:text-[#85817D]">{persona.email}</p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#58716A] dark:text-[#B8B2AC] mb-4 leading-relaxed">
                    {persona.description}
                  </p>

                  {/* Capabilities */}
                  <div className="mb-5 pt-3 border-t border-[#DDEBE5] dark:border-[#383838]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#087F70] dark:text-[#FFAA35] mb-2 font-mono">
                      Key Permissions &amp; Tasks
                    </div>
                    <ul className="space-y-1.5">
                      {persona.keyResponsibilities.map((resp, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-[#58716A] dark:text-[#B8B2AC] flex items-start gap-1.5"
                        >
                          <ChevronRight className="w-3 h-3 text-[#087F70] dark:text-[#FFAA35] shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="button"
                  onClick={() => handleDemoSignIn(persona)}
                  disabled={activeSubmitting !== null}
                  className="w-full py-2.5 px-4 btn-gradient-warm text-white dark:text-ink-950 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/15 dark:shadow-orange-500/10"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter as {persona.name.split(" ")[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Navigation Footer */}
        <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-[#DDEBE5] dark:border-[#383838] pt-8 text-xs text-[#82948E] dark:text-[#85817D]">
          <Link
            href="/login"
            className="text-[#087F70] hover:text-[#10A995] dark:text-[#FFAA35] dark:hover:text-[#FFD84D] font-semibold transition-colors flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Standard Workspace Sign-In</span>
          </Link>
          <span className="hidden sm:inline text-[#DDEBE5] dark:text-[#383838]">•</span>
          <Link
            href="/register"
            className="text-[#58716A] hover:text-[#18352F] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] font-medium transition-colors"
          >
            Create New Organization
          </Link>
          <span className="hidden sm:inline text-[#DDEBE5] dark:text-[#383838]">•</span>
          <Link
            href="/"
            className="text-[#82948E] hover:text-[#18352F] dark:text-[#85817D] dark:hover:text-[#F7F3ED] font-medium transition-colors"
          >
            Return to Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
