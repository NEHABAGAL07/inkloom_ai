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
          <label className="block text-xs font-semibold text-navy mb-1.5">
            Content Campaign Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-workspace border border-border rounded-xl px-4 py-2.5 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            placeholder="e.g. Q4 Global Product Announcement"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1.5">
            Context / Target Audience
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-workspace border border-border rounded-xl px-4 py-2.5 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            placeholder="e.g. Enterprise B2B Buyers, Social Media, PR"
          />
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            mode === "text"
              ? "bg-navy text-white shadow-subtle"
              : "text-ink-secondary hover:text-navy hover:bg-workspace"
          }`}
        >
          ✍️ Direct Text Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            mode === "file"
              ? "bg-navy text-white shadow-subtle"
              : "text-ink-secondary hover:text-navy hover:bg-workspace"
          }`}
        >
          📁 Document / Media File
        </button>
      </div>

      {/* Content Entry Area */}
      {mode === "text" ? (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-navy">
              Content Draft Text *
            </label>
            <span className="text-xs text-ink-muted font-mono">{wordCount} words</span>
          </div>
          <textarea
            required
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-workspace border border-border rounded-xl p-4 text-sm text-navy font-sans focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal leading-relaxed"
            placeholder="Paste draft copy, marketing announcement, or script here..."
          />
        </div>
      ) : (
        <FileUpload onFileSelect={(f) => setSelectedFile(f)} selectedFile={selectedFile} />
      )}

      {/* Guidelines Applied Badge Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary pt-2">
        <span className="font-semibold text-navy">Active Governance Rules:</span>
        <span className="px-2.5 py-1 rounded-md bg-teal/10 border border-teal/20 text-teal text-[11px] font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> Tone & Voice 2026
        </span>
        <span className="px-2.5 py-1 rounded-md bg-teal/10 border border-teal/20 text-teal text-[11px] font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> Terminology Registry
        </span>
        <span className="px-2.5 py-1 rounded-md bg-teal/10 border border-teal/20 text-teal text-[11px] font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> Certified Claims Verification
        </span>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => setText("")}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-muted hover:text-navy transition"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-teal hover:bg-teal-hover text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-subtle transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              <span>Running Brand Audit Pass...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              <span>Run AI Brand Audit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
