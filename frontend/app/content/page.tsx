'use client';

import React from 'react';
import { ContentSubmitForm } from '../../components/content/ContentSubmitForm';

export default function ContentSubmissionPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Intake & Verification
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Submit Content for Governance Audit</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit text copy, advertising scripts, or media files to be checked against active brand voice, terminology, and legal claims.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentSubmitForm />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">What will be evaluated?</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">1.</span>
                <span><strong>Terminology & Trademark Casing:</strong> Checks for improper casing, depreciated names, and unapproved product phrasing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">2.</span>
                <span><strong>Editorial Voice & Tone:</strong> Enforces authoritative enterprise standards while flagging hyperbolic colloquialisms.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">3.</span>
                <span><strong>Substantiation & Claims:</strong> Identifies absolute guarantees and checks them against the certified claims registry.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">4.</span>
                <span><strong>Visual Compliance:</strong> Contrast ratios, logo clearspace, and official color palette adherence.</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <span>⚠️</span> Human-in-the-Loop Safeguard
            </h4>
            <p className="mt-1 leading-relaxed text-amber-800">
              AI audit results serve as decision-support analysis. Content cannot be published until a designated brand reviewer formally approves the submission in the review queue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
