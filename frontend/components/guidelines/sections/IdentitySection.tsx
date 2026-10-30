"use client";

import React, { useState } from "react";
import { BrandGuidelineData } from "@/types";
import { BookOpen } from "lucide-react";

interface IdentitySectionProps {
  data: BrandGuidelineData;
  setData: React.Dispatch<React.SetStateAction<BrandGuidelineData>>;
  addTag: (path: string[], tag: string) => void;
  removeTag: (path: string[], index: number) => void;
}

export function IdentitySection({
  data,
  setData,
  addTag,
  removeTag,
}: IdentitySectionProps) {
  const [valInput, setValInput] = useState("");

  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal" />
          A1. Brand Identity &amp; Corporate Purpose
        </h2>
        <p className="text-xs text-ink-secondary mt-1">
          Core enterprise positioning, mission statement, target market, and audience personas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Official Brand Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={data.identity?.brand_name || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, brand_name: e.target.value },
              })
            }
            placeholder="e.g. Acme Cloud Systems"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Industry &amp; Business Sector
          </label>
          <input
            type="text"
            value={data.identity?.industry || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, industry: e.target.value },
              })
            }
            placeholder="e.g. Enterprise Cloud & Infrastructure"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Brand Tagline / Slogan
          </label>
          <input
            type="text"
            value={data.identity?.tagline || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, tagline: e.target.value },
              })
            }
            placeholder="e.g. Autonomous Zero-Trust Infrastructure for the AI-Native Enterprise"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Company Overview &amp; Description
          </label>
          <textarea
            rows={3}
            value={data.identity?.description || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, description: e.target.value },
              })
            }
            placeholder="Describe your organization's core operations, products, and market value..."
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Brand Mission Statement
          </label>
          <textarea
            rows={2}
            value={data.identity?.mission || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, mission: e.target.value },
              })
            }
            placeholder="What immediate value does your organization champion?"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Brand Vision Statement
          </label>
          <textarea
            rows={2}
            value={data.identity?.vision || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, vision: e.target.value },
              })
            }
            placeholder="Where is your brand heading over the next decade?"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Market Positioning
          </label>
          <input
            type="text"
            value={data.identity?.positioning || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, positioning: e.target.value },
              })
            }
            placeholder="e.g. The premier enterprise cloud infrastructure platform combining silicon-grade isolation..."
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Primary Audience
          </label>
          <input
            type="text"
            value={data.identity?.primary_audience || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, primary_audience: e.target.value },
              })
            }
            placeholder="e.g. Chief Technology Officers, Principal Platform Architects"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Secondary Audience
          </label>
          <input
            type="text"
            value={data.identity?.secondary_audience || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, secondary_audience: e.target.value },
              })
            }
            placeholder="e.g. Site Reliability Engineers, DevSecOps Leads"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        {/* Values Pill Tags */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Core Brand Values
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.identity?.values?.map((val, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs rounded-lg flex items-center gap-1.5"
              >
                {val}
                <button
                  type="button"
                  onClick={() => removeTag(["identity", "values"], idx)}
                  className="hover:text-rose-400"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add value (e.g. Transparent Reliability)"
              value={valInput}
              onChange={(e) => setValInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(["identity", "values"], valInput);
                  setValInput("");
                }
              }}
              className="px-3 py-1.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal flex-1"
            />
            <button
              type="button"
              onClick={() => {
                addTag(["identity", "values"], valInput);
                setValInput("");
              }}
              className="px-3 py-1.5 bg-workspace hover:bg-surface text-xs font-semibold rounded-xl text-ink-primary border border-border hover:border-teal transition"
            >
              + Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Website URL
          </label>
          <input
            type="url"
            value={data.identity?.website_url || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, website_url: e.target.value },
              })
            }
            placeholder="https://acmecloud.com"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
            Brand Governance Contact Email
          </label>
          <input
            type="email"
            value={data.identity?.contact_email || ""}
            onChange={(e) =>
              setData({
                ...data,
                identity: { ...data.identity, contact_email: e.target.value },
              })
            }
            placeholder="brand@acmecloud.com"
            className="w-full px-3.5 py-2.5 bg-workspace border border-border rounded-lg text-xs text-ink-primary focus:outline-none focus:border-teal"
          />
        </div>
      </div>
    </div>
  );
}

