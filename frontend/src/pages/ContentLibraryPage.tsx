import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { ContentItem, WorkflowStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../lib/utils/formatters';
import { Search, PlusCircle, ArrowRight, ShieldAlert, History, FileText } from 'lucide-react';

export const ContentLibraryPage: React.FC = () => {
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getContentList();
      setContentList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load content items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  if (loading) return <LoadingState message="Loading marketing content catalog..." />;
  if (error) return <ErrorState message={error} onRetry={fetchContent} />;

  const filteredContent = contentList.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchId = item.content_id.toLowerCase().includes(q);
      if (!matchTitle && !matchId) return false;
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.content_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Marketing Content Library"
        description="Comprehensive repository of marketing drafts, revisions, and verified compliance histories."
        actions={
          <Link
            to="/audit/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-600/20 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Submission</span>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or content ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_audit">Auditing</option>
            <option value="pending_approval">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-brand-500 uppercase"
          >
            <option value="all">All Modalities</option>
            <option value="text">Text Copy</option>
            <option value="document">Document</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      {filteredContent.length === 0 ? (
        <EmptyState
          title="No Matching Content Found"
          description={
            contentList.length === 0
              ? 'Your content library is currently empty. Submit your first marketing draft to start auditing.'
              : 'Try clearing your filters or search keywords.'
          }
          action={
            contentList.length === 0
              ? {
                  label: 'Submit Marketing Copy',
                  onClick: () => (window.location.href = '/audit/new'),
                }
              : undefined
          }
        />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Title & Reference</th>
                  <th className="py-3.5 px-4">Modality</th>
                  <th className="py-3.5 px-4">Revision</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4">Last Modified</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContent.map((item) => (
                  <tr key={item.content_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <Link
                        to={`/content/${item.content_id}`}
                        className="font-semibold text-white hover:text-brand-300 transition-colors block"
                      >
                        {item.title}
                      </Link>
                      <span className="text-xs text-slate-500 font-mono">{item.content_id}</span>
                    </td>
                    <td className="py-4 px-4 text-xs capitalize text-slate-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        <FileText className="w-3 h-3 text-brand-400" />
                        {item.content_type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300">
                        v{item.current_revision}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(item.updated_at || item.created_at)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/content/${item.content_id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs border border-transparent hover:border-slate-700 transition-colors inline-flex items-center gap-1"
                          title="Version History & Details"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>History</span>
                        </Link>
                        <Link
                          to={`/audits?contentId=${item.content_id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-brand-200 text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1"
                          title="View Latest Audit"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
