"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
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
      // Authenticates with backend /api/v1/auth/login with password123
      await login(persona.email, "password123");
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
    <div className="min-h-screen bg-workspace text-ink-primary py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon &amp; Evaluation Sandbox</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Role-Based Evaluation Access
          </h1>
          <p className="text-sm text-ink-secondary mt-2 max-w-2xl mx-auto">
            Test Inkloom AI&apos;s role-based access control (RBAC), multi-tenant isolation, and pre-publication compliance workflows using pre-configured evaluation accounts.
          </p>
        </div>

        {/* Notice Banner */}
        <div className="mb-8 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Evaluation Sandbox Notice:</span> Each button triggers a legitimate backend authentication request (
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">POST /api/v1/auth/login</code>
            ) verifying user credentials, issuing an HttpOnly session cookie, and loading tenant-scoped data. These accounts are isolated and intended for platform review.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-status-error text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
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
                className="bg-surface border border-border hover:border-teal/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-subtle hover:shadow-card"
              >
                <div>
                  {/* Top Role & Org Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${persona.badgeColor}`}
                    >
                      {persona.roleLabel}
                    </span>
                    <span className="text-[11px] font-medium text-ink-muted flex items-center gap-1">
                      <Building className="w-3 h-3 text-teal" />
                      {persona.orgName}
                    </span>
                  </div>

                  {/* Persona Identity */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-navy">{persona.name}</h3>
                    <p className="text-xs font-mono text-ink-muted">{persona.email}</p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                    {persona.description}
                  </p>

                  {/* Capabilities */}
                  <div className="mb-5 pt-3 border-t border-border/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-teal mb-2">
                      Key Permissions &amp; Tasks
                    </div>
                    <ul className="space-y-1.5">
                      {persona.keyResponsibilities.map((resp, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-ink-primary flex items-start gap-1.5"
                        >
                          <ChevronRight className="w-3 h-3 text-teal shrink-0 mt-0.5" />
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
                  className="w-full py-2.5 px-4 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-subtle"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
        <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-border pt-8 text-xs text-ink-secondary">
          <Link
            href="/login"
            className="text-teal hover:text-teal-hover font-semibold transition-colors flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Standard Workspace Sign-In</span>
          </Link>
          <span className="hidden sm:inline text-border">•</span>
          <Link
            href="/register"
            className="text-ink-secondary hover:text-navy font-medium transition-colors"
          >
            Create New Organization
          </Link>
          <span className="hidden sm:inline text-border">•</span>
          <Link
            href="/"
            className="text-ink-muted hover:text-navy font-medium transition-colors"
          >
            Return to Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
