"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
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
  Sparkles,
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
    const queryToken = searchParams.get("token");
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
    <div className="min-h-screen bg-[#080B14] text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inkloom AI Brand Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Workspace Invitation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Join your company&apos;s brand governance &amp; AI compliance team
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0F1424] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Invitation Issue</p>
                <p className="text-rose-300 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to {invitation?.organization_name}!</h2>
              <p className="text-sm text-slate-400">
                Your account has been created and verified. Entering workspace...
              </p>
            </div>
          ) : !invitation ? (
            /* Token Lookup Step */
            <form onSubmit={handleManualLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Invitation Code or Token
                </label>
                <div className="relative">
                  <ShieldCheck className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Paste your invitation token (e.g. inv_...)"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#080B14] border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token.trim()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                {isLoading ? "Validating Token..." : "Verify Invitation"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* Accept & Join Form */
            <form onSubmit={handleAccept} className="space-y-5">
              {/* Org & Role Badge */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{invitation.organization_name}</h3>
                    <p className="text-xs text-slate-400">Invited to join workspace</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  {invitation.role}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Invited Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    disabled
                    value={invitation.email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080B14] border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Set Your Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080B14] border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim() || !password}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
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
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
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
        <div className="min-h-screen bg-[#080B14] flex items-center justify-center text-slate-400 text-sm">
          Loading invitation...
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
