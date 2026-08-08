import React from 'react';
import { Visitor } from '../types';
import StatusBadge from './StatusBadge';

interface VisitorCardProps {
  visitor: Visitor;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCheckout?: (id: string) => void;
  onViewPass?: (visitor: Visitor) => void;
  showActions?: boolean;
  role?: 'receptionist' | 'employee';
}

export default function VisitorCard({
  visitor,
  onApprove,
  onDecline,
  onCheckout,
  onViewPass,
  showActions = true,
  role,
}: VisitorCardProps) {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const photoUrl = visitor.photo_url?.startsWith('http')
    ? visitor.photo_url
    : visitor.photo_url
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${visitor.photo_url}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 ring-2 ring-slate-100 group-hover:ring-primary-100 transition-all">
            {photoUrl ? (
              <img src={photoUrl} alt={visitor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-800 truncate">{visitor.name}</h3>
              <StatusBadge status={visitor.status} />
            </div>
            <div className="space-y-0.5 text-sm text-slate-500">
              <p className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {visitor.mobile}
              </p>
              {visitor.company && <p className="truncate">🏢 {visitor.company}</p>}
              <p className="truncate">📋 {visitor.purpose}</p>
              {visitor.host_name && <p className="truncate">👤 Host: {visitor.host_name}</p>}
              <p className="text-xs text-slate-400">
                ⏰ {formatTime(visitor.check_in_time)}
                {visitor.visitor_type && visitor.visitor_type !== 'Guest' && ` · ${visitor.visitor_type}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2 flex-wrap">
          {role === 'employee' && visitor.status === 'waiting' && (
            <>
              <button
                onClick={() => onApprove?.(visitor._id)}
                className="flex-1 px-4 py-2 bg-success-500 hover:bg-success-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => onDecline?.(visitor._id)}
                className="flex-1 px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ✕ Decline
              </button>
            </>
          )}
          {role === 'receptionist' && visitor.status === 'approved' && (
            <button
              onClick={() => onCheckout?.(visitor._id)}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Check Out
            </button>
          )}
          {visitor.status === 'approved' && visitor.qr_code_data && (
            <button
              onClick={() => onViewPass?.(visitor)}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              View Pass
            </button>
          )}
        </div>
      )}
    </div>
  );
}
