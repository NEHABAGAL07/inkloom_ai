import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api/client';
import { BrandGuideline } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { Sparkles, FileText, UploadCloud, AlertCircle, Info } from 'lucide-react';

export const ContentAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'text' | 'document' | 'image' | 'video'>('text');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const data = await api.getGuidelines();
        setGuidelines(data);
        if (data.length > 0) {
          setSelectedGuidelineId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching guidelines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuidelines();
  }, []);

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a content title.');
      return;
    }
    if (!rawText.trim()) {
      setError('Please enter or paste the marketing copy to audit.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Submit content to backend
      const content = await api.submitContent({
        title,
        content_type: contentType,
        raw_text: rawText,
      });

      // 2. Trigger audit run against version 1
      await api.runAudit(
        content.content_id,
        content.current_revision,
        selectedGuidelineId ? [selectedGuidelineId] : undefined
      );

      // 3. Navigate directly to the results page
      navigate(`/audits?contentId=${content.content_id}`);
    } catch (err: any) {
      setError(err.message || 'Audit execution failed');
      setIsSubmitting(false);
    }
  };

  const loadSampleCopy = () => {
    setTitle('Q4 Cloud Enterprise Launch Announcement');
    setRawText(
      'We are super pumped to announce inkloom ai today! It is a revolutionary platform that guarantees 100% error free copy and reduces marketing turnaround times by 68%. Click the red button to begin.'
    );
  };

  if (loading) return <LoadingState message="Loading governance guidelines..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Submit Content for Brand Audit"
        description="Verify brand voice, terminology, legal claims, and accessibility before publication."
        actions={
          <button
            type="button"
            onClick={loadSampleCopy}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 border border-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Copy</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-semibold block">Submission Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleAuditSubmit} className="glass-card rounded-2xl p-6 md:p-8 border border-slate-800 space-y-6">
        {/* Title & Guideline Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Content Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Enterprise Product Launch"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 p-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Target Brand Guideline *
            </label>
            <select
              value={selectedGuidelineId}
              onChange={(e) => setSelectedGuidelineId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 p-3 text-sm text-slate-200 outline-none transition-colors"
            >
              {guidelines.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.category}) v{g.version}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Content Modality
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'text', label: 'Copy / Text', icon: FileText },
              { id: 'document', label: 'Document (PDF/DOCX)', icon: UploadCloud, disabled: true },
              { id: 'image', label: 'Image Asset', icon: UploadCloud, disabled: true },
              { id: 'video', label: 'Video Asset', icon: UploadCloud, disabled: true },
            ].map((type) => (
              <button
                type="button"
                key={type.id}
                disabled={type.disabled}
                onClick={() => setContentType(type.id as any)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  contentType === type.id
                    ? 'border-brand-500 bg-brand-950/40 text-brand-300'
                    : type.disabled
                    ? 'border-slate-800/40 bg-slate-950/20 text-slate-600 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Note: Rich media extraction (OCR/Video) interfaces are active; text analysis is currently fully supported.
          </span>
        </div>

        {/* Raw Text Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Marketing Copy / Content Body *
            </label>
            <span className="text-xs text-slate-500">{rawText.length} characters</span>
          </div>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your marketing email, press release, social caption, or blog draft here..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 p-4 text-sm text-slate-200 placeholder-slate-500 outline-none resize-y transition-colors leading-relaxed font-sans"
            required
          />
        </div>

        {/* Governance Notice */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">Brand Policy Notice:</span>
            Running an audit analyzes content against forbidden phrases, canonical naming, evidence databases, and tone standards. Content that achieves a clean audit still requires formal human reviewer approval before being marked approved.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-xl shadow-brand-600/25 transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Auditing Against Brand Rules...' : 'Execute Brand Governance Audit'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
