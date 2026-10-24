"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
import {
  Shield,
  Building,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

const INDUSTRIES = [
  "Technology & SaaS",
  "Healthcare & Life Sciences",
  "Financial Services & FinTech",
  "Consumer Goods & Retail",
  "Media & Entertainment",
  "Manufacturing & Industrial",
  "Professional Services",
  "Other",
];

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("Technology & SaaS");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already authenticated, allow navigation to workspace
  if (isAuthenticated && !success) {
    return (
      <div className="min-h-screen bg-workspace flex items-center justify-center p-6 text-center">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md shadow-subtle">
          <Shield className="w-10 h-10 text-teal mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy mb-2">Already Authenticated</h2>
          <p className="text-sm text-ink-secondary mb-6">
            You are currently signed in. You can access your workspace or sign out to register a new tenant.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-teal hover:bg-teal-hover text-white text-sm font-semibold rounded-xl text-center transition shadow-subtle"
            >
              Enter Workspace
            </Link>
            <Link
              href="/login"
              className="text-xs text-ink-muted hover:text-navy font-medium"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName.trim() || !fullName.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and re-enter.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        organization_name: orgName.trim(),
        industry,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to register organization. An account with this email may already exist."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-lg">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold mb-3 hover:bg-teal/15 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Inkloom AI Brand Governance</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">
            Register Your Organization
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-sm mx-auto">
            Create an enterprise brand compliance workspace and assign your primary administrator.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-subtle">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-status-error text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Registration Alert</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-status-success animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">Organization Created!</h2>
              <p className="text-sm text-ink-secondary">
                Welcome to Inkloom AI. Initializing your brand governance workspace...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      required
                      placeholder="Acme Global Inc."
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    Industry Sector
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy focus:outline-none focus:border-teal transition-colors appearance-none cursor-pointer"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Administrator Details */}
              <div className="pt-2 border-t border-border/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal mb-3">
                  Primary Administrator Account
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="text"
                        required
                        placeholder="Alex Mercer"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="email"
                        required
                        placeholder="admin@acme.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-navy transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="••••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-workspace border border-border rounded-xl text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Minimum 6 characters. You will be assigned the <strong>Brand Administrator</strong> role.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-subtle"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Creating Organization...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Organization</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Auxiliary Links */}
              <div className="text-center pt-2 space-y-2">
                <p className="text-xs text-ink-secondary">
                  Already registered?{" "}
                  <Link
                    href="/login"
                    className="text-teal hover:text-teal-hover font-semibold transition-colors"
                  >
                    Sign in to your workspace
                  </Link>
                </p>
                <div>
                  <Link
                    href="/"
                    className="text-xs text-ink-muted hover:text-navy transition-colors font-medium"
                  >
                    ← Back to Public Overview
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
