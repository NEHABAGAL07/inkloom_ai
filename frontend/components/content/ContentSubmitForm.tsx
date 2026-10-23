'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploadZone } from './FileUploadZone';
import { ApiService } from '../../services/api';

export const ContentSubmitForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'text' | 'document' | 'image' | 'video'>('text');
  const [rawText, setRawText] = useState(
    'Try inkloom today for best-in-class workflows. Our system delivers a 100% error-free guarantee across all media. We are super pumped to announce this capability.'
  );
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Submit content
      const submission = await ApiService.submitContent({
        title,
        content_type: file ? (contentType === 'text' ? 'document' : contentType) : contentType,
        raw_text: rawText,
        file: file || undefined,
      });

      // 2. Trigger automated audit
      await ApiService.runAudit(submission.id);

      // 3. Navigate to audits viewer
      router.push('/audits');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit content for audit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Submission Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q4 Global Brand Campaign Copy"
          required
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Target Category
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="text">Marketing Copy & Social Posts</option>
            <option value="document">Corporate Document (PDF / DOCX)</option>
            <option value="image">Graphic / Banner Asset</option>
            <option value="video">Promotional Video / Transcript</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Governance Policy
          </label>
          <div className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 flex items-center justify-between">
            <span>Global Brand Standards v2.4</span>
            <span className="text-xs text-indigo-600 font-medium">Default</span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Upload Asset (Optional)
        </label>
        <FileUploadZone
          selectedFile={file}
          onFileSelected={(f) => {
            setFile(f);
            if (f.name.endsWith('.pdf') || f.name.endsWith('.docx')) setContentType('document');
            else if (f.name.match(/\.(png|jpe?g)$/i)) setContentType('image');
            else if (f.name.endsWith('.mp4')) setContentType('video');
          }}
          onClearFile={() => setFile(null)}
        />
      </div>

      {/* Raw Text Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Content Copy / Script
        </label>
        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste draft copy, press release paragraphs, slogans, or scripts..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans text-slate-800 leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Audit runs deterministic terminology, tone, and registry claim checks.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Auditing Content...' : 'Submit & Run Audit'}
        </button>
      </div>
    </form>
  );
};
