import React from 'react';
import { ContentItem } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDate } from '../../lib/utils/formatters';
import { CheckSquare, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReviewQueueTableProps {
  items: ContentItem[];
  onOpenReview: (item: ContentItem) => void;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({ items, onOpenReview }) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-5">Content Item</th>
              <th className="py-3.5 px-4">Version</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Submitted</th>
              <th className="py-3.5 px-5 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item) => (
              <tr key={item.content_id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-5">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5 font-mono">
                    {item.content_id}
                  </div>
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
                  <div className="inline-flex items-center gap-2">
                    <Link
                      to={`/audits?contentId=${item.content_id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs border border-transparent hover:border-slate-700 transition-colors inline-flex items-center gap-1"
                      title="View Audit"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
                      <span>Audit</span>
                    </Link>

                    <button
                      onClick={() => onOpenReview(item)}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-md shadow-brand-600/20 transition-colors inline-flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Signoff
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
