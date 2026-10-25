"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import { ThemeToggle } from "@/services/theme-context";
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ExternalLink,
  Sparkles,
  Palette,
  FileText,
  Scale,
  Loader2,
} from "lucide-react";

interface QuickDept {
  id: string;
  name: string;
  role: string;
  email: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const QUICK_DEPARTMENTS: QuickDept[] = [
  {
    id: "admin",
    name: "Alex Mercer",
    role: "Brand Admin",
    email: "admin@acmecloud.com",
    badge: "bg-navy/10 text-navy border-navy/20 dark:bg-slate-800 dark:text-slate-200",
    icon: Shield,
    color: "border-slate-300 dark:border-slate-700 hover:border-navy text-navy dark:text-slate-200",
  },
  {
    id: "designer",
    name: "Leo Vance",
    role: "Brand Designer",
    email: "designer@acmecloud.com",
    badge: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    icon: Palette,
    color: "border-purple-200 dark:border-purple-800/60 hover:border-purple-500 text-purple-700 dark:text-purple-300",
  },
  {
    id: "marketing",
    name: "Maya Lin",
    role: "Marketing Lead",
    email: "marketing@acmecloud.com",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    icon: FileText,
    color: "border-amber-200 dark:border-amber-800/60 hover:border-amber-500 text-amber-700 dark:text-amber-300",
  },
  {
    id: "compliance",
    name: "Elena Rostova",
    role: "Legal & Regulatory",
    email: "compliance@acmecloud.com",
    badge: "bg-teal/10 text-teal border-teal/20 dark:bg-teal-950/40 dark:text-teal-300",
    icon: Scale,
    color: "border-teal/30 hover:border-teal text-teal",
  },
];

function LoginContent() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/";
  const reason = searchParams?.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [signingInDept, setSigningInDept] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // If already authenticated, redirect to workspace
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleQuickDeptLogin = async (deptEmail: string, deptId: string) => {
    setSigningInDept(deptId);
    setErrorMessage(null);
    try {
      await login(deptEmail, "password123", true);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMessage(
        err?.message || `Failed to sign in as ${deptId}. Please ensure backend is running.`
      );
      setSigningInDept(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both work email and password.");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid work email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-between selection:bg-teal selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center shadow-subtle group-hover:bg-teal-hover transition">
              <span className="text-white font-extrabold text-sm tracking-tighter">IK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-navy tracking-tight">Inkloom AI</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-workspace text-ink-secondary border border-border">
                Workspace Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1 font-medium transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Sign-In Card Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Reason Notification Banners */}
          {reason === "expired" && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your previous session has expired. Please sign in to resume your workspace.</span>
            </div>
          )}

          {reason === "logged_out" && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You have been signed out successfully. Session invalidated.</span>
            </div>
          )}

          {/* Sign-In Card */}
          <div className="bg-surface rounded-xl border border-border shadow-subtle p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-[11px] font-semibold mb-2">
                <Shield className="w-3 h-3" />
                <span>Authorized Sign-In</span>
              </div>
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                Sign in to your workspace
              </h1>
              <p className="text-xs text-ink-secondary mt-1">
                Choose an enterprise department for instant access, or sign in with credentials.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1-Click Department Switcher Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>One-Click Department Login</span>
                </span>
                <span className="text-[10px] text-ink-muted">Pre-authenticated</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon;
                  const isCurrent = signingInDept === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      disabled={!!signingInDept || isLoading}
                      onClick={() => handleQuickDeptLogin(dept.email, dept.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between group hover:shadow-subtle disabled:opacity-50 bg-workspace/70 hover:bg-workspace ${dept.color}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${dept.badge}`}>
                          {dept.role}
                        </span>
                        {isCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition" />
                        )}
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xs font-bold truncate group-hover:text-teal transition">
                          {dept.name}
                        </div>
                        <div className="text-[10px] text-ink-muted truncate font-mono">
                          {dept.email}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider with "OR" */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-border w-full"></div>
              <span className="bg-surface px-3 text-[10px] uppercase font-bold text-ink-muted tracking-wider absolute">
                or use credentials
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                  Work Email <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-workspace border border-border rounded-lg text-xs text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink-primary">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-teal hover:text-teal-hover font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-workspace border border-border rounded-lg text-xs text-ink-primary placeholder-ink-muted focus:outline-none focus:border-teal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-ink-muted hover:text-ink-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-teal focus:ring-teal"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-border flex flex-col space-y-2 text-center text-xs text-ink-secondary">
              <div>
                <span>Need to set up a new company? </span>
                <Link href="/register" className="text-teal hover:text-teal-hover font-semibold">
                  Register organization
                </Link>
              </div>
              <div>
                <span>Received an invitation code? </span>
                <Link href="/invite" className="text-teal hover:text-teal-hover font-semibold">
                  Accept invite
                </Link>
              </div>
            </div>
          </div>

          {/* Discrete Demo Link (Separated from normal sign-in) */}
          <div className="text-center p-3 rounded-lg bg-surface border border-border text-xs text-ink-muted shadow-subtle flex items-center justify-center gap-2">
            <span>Evaluating for hackathon or compliance review?</span>
            <Link
              href="/demo"
              className="text-teal hover:text-teal-hover font-bold inline-flex items-center gap-1"
            >
              <span>Access Demo Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Password Recovery Protocol</span>
            </div>
            <h3 className="text-lg font-bold text-navy">Zero-Trust Enterprise Password Policy</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Under enterprise compliance guidelines, password resets must be initiated by an authorized Organization Administrator or via identity verification with your legal IT department.
            </p>
            <div className="p-3 bg-workspace border border-border rounded-lg text-xs text-ink-primary space-y-1">
              <p className="font-semibold">Need immediate account recovery?</p>
              <p className="text-ink-secondary text-[11px]">
                Please contact your workspace manager (e.g. <code>admin@acmecloud.com</code>) to re-issue an invitation link or reset your enterprise credentials.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-workspace hover:bg-slate-200 text-ink-primary text-xs font-semibold rounded-lg border border-border transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-ink-muted">
        <span>Inkloom AI Brand Governance &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-workspace flex items-center justify-center">
          <div className="text-xs text-ink-muted">Loading workspace portal...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
