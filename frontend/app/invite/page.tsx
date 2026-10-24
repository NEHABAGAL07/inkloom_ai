"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import { ThemeToggle } from "@/services/theme-context";
import { PublicInvitation } from "@/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  Lock,
  ArrowRight,
  Mail,
  Shield,
} from "lucide-react";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { acceptInvite, isAuthenticated } = useAuth();

  const [token, setToken] = useState<string>("");
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form fields
  const [fullName, setFullName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    const queryToken = searchParams?.get("token");
    if (queryToken) {
      setToken(queryToken);
      inspectToken(queryToken);
    }
  }, [searchParams]);

  const inspectToken = async (tokenToTest: string) => {
    if (!tokenToTest.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.inspectInvitation(tokenToTest.trim());
      setInvitation(data);
    } catch (err: any) {
      setError(err?.message || "Invitation is invalid, expired, or has already been accepted.");
      setInvitation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    inspectToken(token);
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !fullName || !password) {
      setError("Please fill in your full name and choose a secure password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await acceptInvite(token.trim(), fullName.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to accept invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-center items-center p-6 relative transition-colors duration-150">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Inkloom AI Brand Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">
            Workspace Invitation
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Join your organization&apos;s brand governance &amp; compliance workspace
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-subtle">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-status-error text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Invitation Notice</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-status-success animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">Welcome to {invitation?.organization_name}!</h2>
              <p className="text-sm text-ink-secondary">
                Your account has been created and verified. Entering workspace...
              </p>
            </div>
          ) : !invitation ? (
            /* Token Lookup Step */
            <form onSubmit={handleManualLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-2">
                  Invitation Code or Token *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    required
                    placeholder="Paste your invitation token (e.g. inv_...)"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token.trim()}
                className="w-full py-3 px-4 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-subtle"
              >
                {isLoading ? "Validating Token..." : "Verify Invitation"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-ink-muted">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="hover:text-navy transition-colors font-semibold text-teal"
                >
                  Return to Workspace Sign-In
                </button>
                <span className="hidden sm:inline">•</span>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="hover:text-navy transition-colors font-medium"
                >
                  Back to Overview
                </button>
              </div>
            </form>
          ) : (
            /* Accept & Join Form */
            <form onSubmit={handleAccept} className="space-y-5">
              {/* Org & Role Badge */}
              <div className="p-4 rounded-xl bg-workspace border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{invitation.organization_name}</h3>
                    <p className="text-xs text-ink-secondary">Invited to join workspace</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-teal/10 border border-teal/20 text-teal">
                  {invitation.role}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Invited Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="email"
                    disabled
                    value={invitation.email}
                    className="w-full pl-10 pr-4 py-2.5 bg-workspace border border-border rounded-xl text-sm text-ink-muted cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Set Your Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
                <p className="text-[11px] text-ink-muted mt-1">Minimum 6 characters</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim() || !password}
                  className="w-full py-3 px-4 bg-status-success hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-subtle"
                >
                  {isSubmitting ? "Joining Workspace..." : "Accept Invitation & Join"}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvitation(null);
                    setToken("");
                  }}
                  className="text-xs text-ink-muted hover:text-navy transition-colors font-medium"
                >
                  Use a different invitation token
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-workspace flex items-center justify-center text-ink-muted text-sm">
          Loading invitation...
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
