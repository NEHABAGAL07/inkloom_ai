"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/services/auth-context";
import { InkloomLogo } from "@/components/layout/InkloomLogo";
import { BackgroundAtmosphere } from "@/components/layout/BackgroundAtmosphere";
import { ThemeToggle } from "@/services/theme-context";
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
  ChevronLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";

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
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-workspace text-ink-primary flex items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] rounded-2xl p-8 max-w-md shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#383838] flex items-center justify-center mx-auto text-[#087F70] dark:text-[#FFAA35]">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold text-[#18352F] dark:text-[#F7F3ED]">Already Authenticated</h2>
            <p className="text-xs text-[#58716A] dark:text-[#B8B2AC] leading-relaxed">
              You are currently signed in. You can access your workspace or sign out to register a new tenant.
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 btn-gradient-warm rounded-xl text-xs font-bold text-center transition block"
                >
                  Enter Workspace
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/login?action=switch"
                  className="w-full py-2 px-4 btn-dark-secondary rounded-xl text-xs font-semibold text-center transition block"
                >
                  Switch Account
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </MotionConfig>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    const trimmedOrg = orgName.trim();
    const trimmedFull = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedOrg || !trimmedFull || !trimmedEmail || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid corporate work email address (e.g. name@company.com).");
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
        organization_name: trimmedOrg,
        industry,
        full_name: trimmedFull,
        email: trimmedEmail,
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
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-between relative selection:bg-[#FF7A36]/30 selection:text-white transition-colors duration-150">
        <BackgroundAtmosphere variant="split-auth" />

        {/* Header */}
        <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-150">
          <Link href="/" className="group">
            <InkloomLogo size="md" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1 font-medium transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Already have an account? Sign In</span>
              </Link>
            </motion.div>
          </div>
        </header>

        {/* Main Registration Box */}
        <main className="flex-1 flex items-center justify-center py-10 px-6 relative z-20">
          <div className="w-full max-w-xl space-y-6">
            <div className="text-center space-y-2">
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/85 dark:bg-[#202020] border border-[#C8E2D8] dark:border-[#383838] text-xs font-semibold text-[#087F70] dark:text-[#FFAA35] shadow-sm backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#10A995] dark:text-[#FFD84D]" />
                <span>Multi-Tenant Enterprise Isolation</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-[#18352F] dark:text-[#F7F3ED]"
              >
                Register Your Organization
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16 }}
                className="text-xs sm:text-sm text-[#58716A] dark:text-[#B8B2AC] max-w-md mx-auto"
              >
                Create an enterprise brand compliance workspace and assign your primary administrator.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.1 }}
              className="bg-white dark:bg-[#1C1C1C] border border-border dark:border-[#383838] rounded-2xl p-7 sm:p-9 shadow-[0_16px_40px_rgba(22,91,72,0.08)] dark:shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#58D9D0] dark:from-[#FFD84D] dark:via-[#FF7A36] dark:to-[#F45B91]" />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-[#272727] border border-rose-200 dark:border-[#FF6B78]/40 flex items-start gap-3 text-rose-700 dark:text-[#FF6B78] text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-[#FF6B78]" />
                      <div>
                        <p className="font-bold">Registration Alert</p>
                        <p className="mt-0.5">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="text-center py-8 space-y-3"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 18 }}
                      className="w-16 h-16 rounded-2xl bg-[#E8F7F1] dark:bg-[#272727] border border-[#C8E2D8] dark:border-[#72D6A1]/40 flex items-center justify-center mx-auto text-[#087F70] dark:text-[#72D6A1]"
                    >
                      <CheckCircle2 className="w-8 h-8" />
                    </motion.div>
                    <h2 className="text-xl font-heading font-bold text-[#18352F] dark:text-[#F7F3ED]">
                      Organization Workspace Created!
                    </h2>
                    <p className="text-xs text-[#58716A] dark:text-[#B8B2AC]">
                      Welcome to Inkloom AI. Initializing your zero-trust brand governance workspace...
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                          Organization Name <span className="text-[#E11D48]">*</span>
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82948E] dark:text-[#85817D]" />
                          <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="Acme Cloud Systems"
                            className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                          Industry Sector <span className="text-[#E11D48]">*</span>
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82948E] dark:text-[#85817D]" />
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] transition"
                          >
                            {INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind} className="bg-white dark:bg-[#1C1C1C] text-[#18352F] dark:text-[#F7F3ED]">
                                {ind}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                        Primary Administrator Full Name <span className="text-[#E11D48]">*</span>
                      </label>
                      <div className="relative">
                        <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82948E] dark:text-[#85817D]" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Mercer"
                          className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                        Corporate Work Email <span className="text-[#E11D48]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82948E] dark:text-[#85817D]" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@acmecloud.com"
                          className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                          Password (min. 6 chars) <span className="text-[#E11D48]">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82948E] dark:text-[#85817D]" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82948E] hover:text-[#18352F] dark:text-[#85817D] dark:hover:text-[#F7F3ED] transition"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#18352F] dark:text-[#F7F3ED] mb-1.5">
                          Confirm Password <span className="text-[#E11D48]">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82948E] dark:text-[#85817D]" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[#F7FBF9] dark:bg-[#141414] border border-border dark:border-[#383838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#18352F] dark:text-[#F7F3ED] placeholder:text-[#82948E] dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10A995] dark:focus:border-[#FFAA35] focus:ring-1 focus:ring-[#10A995] dark:focus:ring-[#FFAA35] transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        className="w-full py-3 px-4 btn-gradient-warm rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-warmGlow disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#111111]" />
                            <span>Provisioning Organization Workspace...</span>
                          </>
                        ) : (
                          <>
                            <span>Provision Enterprise Workspace</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 lg:px-12 py-4 border-t border-border bg-white dark:bg-[#111111] text-[11px] text-[#82948E] dark:text-[#85817D] flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-150">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10A995] dark:bg-[#72D6A1] animate-pulse" />
            <span>Tenant Zero-Trust Isolation Active</span>
          </div>
          <div>Inkloom AI Brand Governance © 2026. All rights reserved.</div>
        </footer>
      </div>
    </MotionConfig>
  );
}
