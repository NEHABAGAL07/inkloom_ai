"use client";

import React, { useState } from "react";
import { BrandGuidelineData } from "@/types";
import { FileText, AlertTriangle, Trash2 } from "lucide-react";

interface VoiceSectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
  addTag: (path: string[], tag: string) => void;
  removeTag: (path: string[], index: number) => void;
}

export function VoiceSection({
  data,
  setData,
  addTag,
  removeTag,
}: VoiceSectionProps) {
  const [avoidInput, setAvoidInput] = useState("");

  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal" />
          A2. Brand Voice, Tone &amp; Communication Standards
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Configure tonal parameters, formality levels, forbidden vocabulary, and approved messaging copy.
        </p>
      </div>

      <div className="space-y-4">
        {/* Brand Tone Selectable Badges */}
        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-2">
            Primary Brand Tones (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Authoritative",
              "Consultative",
              "Engineering-Grade",
              "Empowering",
              "Empathetic",
              "Direct",
              "Sophisticated",
              "Conversational",
              "Friendly",
              "Academic",
            ].map((tone) => {
              const isSelected = data.voice?.brand_tone?.includes(tone);
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    const current = data.voice?.brand_tone || [];
                    const updated = isSelected
                      ? current.filter((t) => t !== tone)
                      : [...current, tone];
                    setData({
                      ...data,
                      voice: { ...data.voice, brand_tone: updated },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : "bg-workspace text-ink-muted border-border hover:border-border"
                  }`}
                >
                  {tone}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
              Formality Level
            </label>
            <select
              value={data.voice?.formality_level || "professional"}
              onChange={(e) =>
                setData({
                  ...data,
                  voice: { ...data.voice, formality_level: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
            >
              <option value="casual">Casual (Friendly, colloquial)</option>
              <option value="conversational">Conversational (Accessible, direct)</option>
              <option value="professional">Professional (Enterprise-grade, balanced)</option>
              <option value="formal">Formal (Executive, institutional)</option>
              <option value="academic">Academic (Rigorous, scientific)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
              Sentence Length Preference
            </label>
            <select
              value={data.voice?.sentence_length_preference || "concise"}
              onChange={(e) =>
                setData({
                  ...data,
                  voice: {
                    ...data.voice,
                    sentence_length_preference: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
            >
              <option value="concise">Concise (Under 18 words per sentence)</option>
              <option value="balanced">Balanced (15-25 words)</option>
              <option value="detailed">Detailed (Long-form technical prose)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
              Communication Style &amp; Guidelines
            </label>
            <textarea
              rows={2}
              value={data.voice?.communication_style || ""}
              onChange={(e) =>
                setData({
                  ...data,
                  voice: { ...data.voice, communication_style: e.target.value },
                })
              }
              placeholder="e.g. Clear, technical precision backed by empirical benchmarks rather than marketing hype..."
              className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* Words to Avoid (Crucial for AI Engine Terminology checker) */}
        <div className="p-4 rounded-xl bg-workspace/60 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Words &amp; Phrases to Avoid (Enforced by AI Engine)</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                The AI audit engine flags any creative asset containing these terms as non-compliant.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.voice?.words_to_avoid?.map((word, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-lg flex items-center gap-1.5 font-mono"
              >
                {word}
                <button
                  type="button"
                  onClick={() => removeTag(["voice", "words_to_avoid"], idx)}
                  className="hover:text-white"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add forbidden term (e.g. miracle, magic, foolproof, OldProduct)"
              value={avoidInput}
              onChange={(e) => setAvoidInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(["voice", "words_to_avoid"], avoidInput);
                  setAvoidInput("");
                }
              }}
              className="px-3 py-1.5 bg-workspace border border-border rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 flex-1"
            />
            <button
              type="button"
              onClick={() => {
                addTag(["voice", "words_to_avoid"], avoidInput);
                setAvoidInput("");
              }}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-xl border border-rose-800"
            >
              + Add Forbidden Term
            </button>
          </div>
        </div>

        {/* Approved Copy Examples */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-secondary">
            Approved Brand Messaging Examples
          </label>
          {data.voice?.approved_copy_examples?.map((ex, idx) => (
            <div
              key={idx}
              className="p-3 bg-workspace border border-border rounded-xl flex items-start justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {ex.context}
                </span>
                <p className="text-xs text-ink-primary mt-1 italic">&ldquo;{ex.text}&rdquo;</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [...(data.voice?.approved_copy_examples || [])];
                  updated.splice(idx, 1);
                  setData({
                    ...data,
                    voice: { ...data.voice, approved_copy_examples: updated },
                  });
                }}
                className="text-ink-muted hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

