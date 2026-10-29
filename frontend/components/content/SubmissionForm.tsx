"use client";

import React, { useState } from "react";
import { FileUpload } from "./FileUpload";
import { api } from "@/services/api";
import { Sparkles, Shield, AlertCircle, FileText, Check } from "lucide-react";

interface SubmissionFormProps {
  onAuditStarted?: (submissionId: string) => void;
}

export function SubmissionForm({ onAuditStarted }: SubmissionFormProps) {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [title, setTitle] = useState("Enterprise Q4 Release Campaign Copy");
  const [description, setDescription] = useState("Marketing draft announcement for cloud compliance module.");
  const [text, setText] = useState(
    "Get started with the powerful Inkloom Cloud Suite today before your competitors crush you. We guarantee a 10x reduction in latency across all regions."
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Create Submission
      const sub = await api.createSubmission({
        title,
        description,
        content_type: mode === "text" ? "text" : "document",
        initial_text: mode === "text" ? text : `[File uploaded: ${selectedFile?.name}]`,
      });

      // 2. Trigger Audit
      await api.triggerAudit(sub.id);

      if (onAuditStarted) {
        onAuditStarted(sub.id);
      } else {
        window.location.href = `/audits?id=${sub.id}`;
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit content for audit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">
            Content Campaign Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-slate-400 dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] transition shadow-xs"
            placeholder="e.g. Q4 Global Product Announcement"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">
            Context / Target Audience
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-slate-400 dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] transition shadow-xs"
            placeholder="e.g. Enterprise B2B Buyers, Social Media, PR"
          />
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#383838] pb-3">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            mode === "text"
              ? "bg-[#CEF0E5] text-[#0F766E] border border-[#BDE7D9] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"
          }`}
        >
          ✍️ Direct Text Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            mode === "file"
              ? "bg-[#CEF0E5] text-[#0F766E] border border-[#BDE7D9] dark:bg-[#272727] dark:text-[#F7F3ED] dark:border-[#FFAA35]/50 shadow-xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222]"
          }`}
        >
          📁 Document / Media File
        </button>
      </div>

      {/* Content Entry Area */}
      {mode === "text" ? (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED]">
              Content Draft Text *
            </label>
            <span className="text-xs text-slate-500 dark:text-[#85817D] font-mono">{wordCount} words</span>
          </div>
          <textarea
            required
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl p-4 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-slate-400 dark:placeholder:text-[#85817D] font-sans focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] leading-relaxed transition shadow-xs"
            placeholder="Paste draft copy, marketing announcement, or script here..."
          />
        </div>
      ) : (
        <FileUpload onFileSelect={(f) => setSelectedFile(f)} selectedFile={selectedFile} />
      )}

      {/* Guidelines Applied Badge Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-[#B8B2AC] pt-2">
        <span className="font-semibold text-[#0F172A] dark:text-[#F7F3ED]">Active Governance Rules:</span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[#0F766E] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-[11px] font-medium flex items-center gap-1 shadow-2xs">
          <Check className="w-3 h-3 text-[#10B981] dark:text-[#72D6A1]" /> Tone & Voice 2026
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[#0F766E] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-[11px] font-medium flex items-center gap-1 shadow-2xs">
          <Check className="w-3 h-3 text-[#10B981] dark:text-[#72D6A1]" /> Terminology Registry
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[#0F766E] dark:bg-[#272727] dark:border-[#383838] dark:text-[#FFAA35] text-[11px] font-medium flex items-center gap-1 shadow-2xs">
          <Check className="w-3 h-3 text-[#10B981] dark:text-[#72D6A1]" /> Certified Claims Verification
        </span>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#383838]">
        <button
          type="button"
          onClick={() => setText("")}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#85817D] dark:hover:text-[#F7F3ED] dark:hover:bg-[#222222] transition"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gradient-warm font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm dark:shadow-warmGlow transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/40 dark:border-[#111111]/30 border-t-white dark:border-t-[#111111] animate-spin"></span>
              <span>Running Brand Audit Pass...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 text-white dark:text-[#111111]" />
              <span>Run AI Brand Audit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
