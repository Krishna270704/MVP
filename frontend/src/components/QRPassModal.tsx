import React from 'react';
import { Visitor } from '../types';

interface QRPassModalProps {
  visitor: Visitor;
  onClose: () => void;
}

export default function QRPassModal({ visitor, onClose }: QRPassModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary-200 uppercase tracking-wider">Visitor Pass</p>
              <h2 className="text-lg font-bold mt-0.5">{visitor.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="px-6 py-6 flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100">
            {visitor.qr_code_data ? (
              <img
                src={visitor.qr_code_data}
                alt="Visitor QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-400">QR not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Pass Details */}
        <div className="px-6 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-400 font-medium">Pass ID</p>
              <p className="text-sm font-bold text-slate-800 font-mono">{visitor.pass_id || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-400 font-medium">Host</p>
              <p className="text-sm font-semibold text-slate-800">{visitor.host_name || '—'}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-slate-400 font-medium">Check-in Time</p>
            <p className="text-sm font-semibold text-slate-800">{formatDateTime(visitor.check_in_time)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-slate-400 font-medium">Purpose</p>
            <p className="text-sm text-slate-700">{visitor.purpose}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
