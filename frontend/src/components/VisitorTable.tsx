import React from 'react';
import { Visitor } from '../types';
import StatusBadge from './StatusBadge';

interface VisitorTableProps {
  visitors: Visitor[];
  loading?: boolean;
}

export default function VisitorTable({ visitors, loading }: VisitorTableProps) {
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
        <p className="text-sm text-slate-400 mt-3">Loading visitors...</p>
      </div>
    );
  }

  if (visitors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
        </svg>
        <p className="text-slate-500 font-medium">No visitors found</p>
        <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Visitor</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Host</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Company</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Purpose</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Check-in</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Check-out</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visitors.map((v) => (
              <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      {v.photo_url ? (
                        <img
                          src={v.photo_url.startsWith('http') ? v.photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${v.photo_url}`}
                          alt={v.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {v.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-400">{v.mobile}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{v.host_name || '—'}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{v.company || '—'}</td>
                <td className="px-5 py-3 text-sm text-slate-600 max-w-[200px] truncate">{v.purpose}</td>
                <td className="px-5 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDateTime(v.check_in_time)}</td>
                <td className="px-5 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDateTime(v.check_out_time)}</td>
                <td className="px-5 py-3"><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
