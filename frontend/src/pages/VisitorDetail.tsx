import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVisitor } from '../api/endpoints';
import { Visitor } from '../types';
import StatusBadge from '../components/StatusBadge';
import QRPassModal from '../components/QRPassModal';

export default function VisitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVisitor(id)
      .then((res) => setVisitor(res.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-500">Visitor not found</p>
      </div>
    );
  }

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

  const photoUrl = visitor.photo_url?.startsWith('http')
    ? visitor.photo_url
    : visitor.photo_url
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${visitor.photo_url}`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
        ← Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 shrink-0 ring-3 ring-white/30">
              {photoUrl ? (
                <img src={photoUrl} alt={visitor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-2xl font-bold">
                  {visitor.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{visitor.name}</h1>
              <p className="text-primary-100 text-sm">{visitor.mobile}</p>
              <div className="mt-2">
                <StatusBadge status={visitor.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Company', value: visitor.company || '—' },
              { label: 'Visitor Type', value: visitor.visitor_type },
              { label: 'Purpose', value: visitor.purpose },
              { label: 'Host', value: visitor.host_name || '—' },
              { label: 'Entity', value: visitor.entity_name || '—' },
              { label: 'Check-in', value: formatDateTime(visitor.check_in_time) },
              { label: 'Check-out', value: formatDateTime(visitor.check_out_time) },
              { label: 'Pass ID', value: visitor.pass_id || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {visitor.status === 'approved' && visitor.qr_code_data && (
            <button
              onClick={() => setShowPass(true)}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-sm"
            >
              View Visitor Pass & QR Code
            </button>
          )}
        </div>
      </div>

      {showPass && visitor && (
        <QRPassModal visitor={visitor} onClose={() => setShowPass(false)} />
      )}
    </div>
  );
}
