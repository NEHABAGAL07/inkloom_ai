import React, { useEffect, useState } from 'react';
import { api } from '../lib/api/client';
import { BrandGuideline, BrandRule, FindingCategory, SeverityLevel, VerifiedFact } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { BookOpen, Plus, ShieldCheck, CheckCircle2, AlertOctagon, ExternalLink } from 'lucide-react';

export const GuidelinesPage: React.FC = () => {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [facts, setFacts] = useState<VerifiedFact[]>([]);
  const [selectedGuideline, setSelectedGuideline] = useState<BrandGuideline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Guideline Modal
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [newGuidelineName, setNewGuidelineName] = useState('');
  const [newGuidelineCategory, setNewGuidelineCategory] = useState('tone_and_voice');

  // New Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleCategory, setRuleCategory] = useState<FindingCategory>('terminology');
  const [ruleSeverity, setRuleSeverity] = useState<SeverityLevel>('high');
  const [prohibitedPhrases, setProhibitedPhrases] = useState('');
  const [requiredPhrases, setRequiredPhrases] = useState('');

  // New Fact Modal
  const [isFactModalOpen, setIsFactModalOpen] = useState(false);
  const [factClaimText, setFactClaimText] = useState('');
  const [factSourceUrl, setFactSourceUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, fData] = await Promise.all([
        api.getGuidelines(),
        api.getVerifiedFacts(),
      ]);
      setGuidelines(gData);
      setFacts(fData);
      if (gData.length > 0) {
        setSelectedGuideline(gData[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load brand guidelines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createGuideline({
        name: newGuidelineName,
        category: newGuidelineCategory,
        version: '1.0',
      });
      setGuidelines([...guidelines, created]);
      setSelectedGuideline(created);
      setIsGuidelineModalOpen(false);
      setNewGuidelineName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create guideline');
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuideline) return;
    try {
      const createdRule = await api.addRuleToGuideline(selectedGuideline.id, {
        title: ruleTitle,
        description: ruleDescription,
        category: ruleCategory,
        severity: ruleSeverity,
        prohibited_phrases: prohibitedPhrases ? prohibitedPhrases.split(',').map((p) => p.trim()) : undefined,
        required_phrases: requiredPhrases ? requiredPhrases.split(',').map((p) => p.trim()) : undefined,
      });

      const updatedGuideline = {
        ...selectedGuideline,
        rules: [...selectedGuideline.rules, createdRule],
      };
      setSelectedGuideline(updatedGuideline);
      setGuidelines(guidelines.map((g) => (g.id === updatedGuideline.id ? updatedGuideline : g)));
      setIsRuleModalOpen(false);
      setRuleTitle('');
      setRuleDescription('');
      setProhibitedPhrases('');
      setRequiredPhrases('');
    } catch (err: any) {
      alert(err.message || 'Failed to add rule');
    }
  };

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdFact = await api.createVerifiedFact({
        claim_text: factClaimText,
        source_url: factSourceUrl,
      });
      setFacts([createdFact, ...facts]);
      setIsFactModalOpen(false);
      setFactClaimText('');
      setFactSourceUrl('');
    } catch (err: any) {
      alert(err.message || 'Failed to register verified claim');
    }
  };

  if (loading) return <LoadingState message="Loading brand guidelines and verified facts..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Brand Guidelines & Policy Standards"
        description="Configure canonical naming rules, voice attributes, and certified knowledge sources."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFactModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Verified Claim</span>
            </button>
            <button
              onClick={() => setIsGuidelineModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-md shadow-brand-600/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Guideline</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Guidelines List */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>Configured Guidelines</span>
              <span className="text-xs text-slate-500">{guidelines.length} total</span>
            </h3>

            <div className="space-y-2">
              {guidelines.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuideline(g)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs block ${
                    selectedGuideline?.id === g.id
                      ? 'border-brand-500 bg-brand-950/40 text-brand-200'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-sm text-white mb-0.5">{g.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="capitalize">{g.category.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>v{g.version}</span>
                    <span>•</span>
                    <span>{g.rules.length} Rules</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Verified Facts & Knowledge Base */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Facts & Evidence</span>
              </h3>
              <span className="text-xs text-slate-500">{facts.length} Verified</span>
            </div>

            <div className="space-y-2.5">
              {facts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-200 font-medium">"{fact.claim_text}"</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                      {Math.round(fact.confidence_score * 100)}% Conf
                    </span>
                  </div>
                  {fact.source_url && (
                    <a
                      href={fact.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-brand-400 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{fact.source_url}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Rules Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {selectedGuideline ? (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedGuideline.name}</h2>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      v{selectedGuideline.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Guideline ID: <code className="text-slate-300">{selectedGuideline.id}</code> • Category: {selectedGuideline.category}
                  </p>
                </div>

                <button
                  onClick={() => setIsRuleModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Brand Rule</span>
                </button>
              </div>

              {/* Rules List */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Enforced Policy Rules ({selectedGuideline.rules.length})
                </h3>

                {selectedGuideline.rules.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    No discrete rules defined yet in this guideline. Click "Add Brand Rule" above.
                  </div>
                ) : (
                  selectedGuideline.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={rule.severity} />
                          <span className="text-xs uppercase font-medium tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {rule.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{rule.id}</span>
                      </div>

                      <h4 className="text-sm font-semibold text-white">{rule.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>

                      {rule.prohibited_phrases && rule.prohibited_phrases.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-rose-400">Prohibited:</span>
                          {rule.prohibited_phrases.map((phrase, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300"
                            >
                              "{phrase}"
                            </span>
                          ))}
                        </div>
                      )}

                      {rule.required_phrases && rule.required_phrases.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-emerald-400">Canonical:</span>
                          {rule.required_phrases.map((phrase, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/60 text-emerald-300"
                            >
                              "{phrase}"
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center text-slate-500">
              Select a guideline on the left to inspect its active rules.
            </div>
          )}
        </div>
      </div>

      {/* New Guideline Modal */}
      {isGuidelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-white">Create New Brand Guideline</h2>
            <form onSubmit={handleCreateGuideline} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Guideline Title
                </label>
                <input
                  type="text"
                  value={newGuidelineName}
                  onChange={(e) => setNewGuidelineName(e.target.value)}
                  placeholder="e.g. Executive Social Media Guidelines"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Category
                </label>
                <select
                  value={newGuidelineCategory}
                  onChange={(e) => setNewGuidelineCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="tone_and_voice">Tone & Voice</option>
                  <option value="terminology">Terminology & Casing</option>
                  <option value="factual_accuracy">Factual Accuracy & Evidence</option>
                  <option value="accessibility">Accessibility & Inclusivity</option>
                  <option value="visual_consistency">Visual Identity</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGuidelineModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs text-white bg-brand-600 hover:bg-brand-500"
                >
                  Create Guideline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700 bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-white">Add Rule to {selectedGuideline?.name}</h2>
            <form onSubmit={handleAddRule} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Rule Title
                </label>
                <input
                  type="text"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="e.g. Prohibited Slang in Formal Communications"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Description / Explanation
                </label>
                <textarea
                  rows={2}
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Explain why this rule exists and how to comply..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 outline-none focus:border-brand-500 capitalize"
                  >
                    <option value="terminology">Terminology</option>
                    <option value="tone">Tone</option>
                    <option value="factual_accuracy">Factual Accuracy</option>
                    <option value="unsupported_claim">Unsupported Claim</option>
                    <option value="accessibility">Accessibility</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                    Severity
                  </label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 outline-none focus:border-brand-500 uppercase"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Prohibited Phrases (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={prohibitedPhrases}
                  onChange={(e) => setProhibitedPhrases(e.target.value)}
                  placeholder="super pumped, revolutionary, game changer"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Canonical Preferred Phrases (Optional)
                </label>
                <input
                  type="text"
                  value={requiredPhrases}
                  onChange={(e) => setRequiredPhrases(e.target.value)}
                  placeholder="Inkloom AI, enterprise brand governance"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs text-white bg-brand-600 hover:bg-brand-500"
                >
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Verified Fact Modal */}
      {isFactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-white">Add Certified Enterprise Claim</h2>
            <form onSubmit={handleCreateFact} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Claim Text (Factual Statement)
                </label>
                <textarea
                  rows={3}
                  value={factClaimText}
                  onChange={(e) => setFactClaimText(e.target.value)}
                  placeholder="e.g. Inkloom AI reduces brand review turnaround times by 68%."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Evidence Document / URL (Optional)
                </label>
                <input
                  type="url"
                  value={factSourceUrl}
                  onChange={(e) => setFactSourceUrl(e.target.value)}
                  placeholder="https://inkloom.ai/research/whitepaper-2026.pdf"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFactModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  Register Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
