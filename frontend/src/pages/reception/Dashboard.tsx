import React, { useState, useEffect, useCallback } from 'react';
import { getVisitors, checkoutVisitor } from '../../api/endpoints';
import { Visitor } from '../../types';
import VisitorCard from '../../components/VisitorCard';
import QRPassModal from '../../components/QRPassModal';
import { useWebSocket } from '../../context/WebSocketContext';

export default function ReceptionDashboard() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const { notifications } = useWebSocket();

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await getVisitors({ today_only: true });
      setVisitors(res.data);
    } catch (err) {
      console.error('Failed to fetch visitors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Refresh when new notifications arrive (approval/decline)
  useEffect(() => {
    if (notifications.length > 0) {
      fetchVisitors();
    }
  }, [notifications.length, fetchVisitors]);

  const handleCheckout = async (id: string) => {
    try {
      await checkoutVisitor(id);
      fetchVisitors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to checkout visitor');
    }
  };

  const stats = {
    total: visitors.length,
    waiting: visitors.filter((v) => v.status === 'waiting').length,
    approved: visitors.filter((v) => v.status === 'approved').length,
    declined: visitors.filter((v) => v.status === 'declined').length,
    checked_out: visitors.filter((v) => v.status === 'checked_out').length,
  };

  const statCards = [
    { label: "Today's Visitors", value: stats.total, color: 'from-primary-500 to-primary-600', icon: '👥' },
    { label: 'Waiting', value: stats.waiting, color: 'from-warning-500 to-warning-600', icon: '⏳' },
    { label: 'Approved', value: stats.approved, color: 'from-success-500 to-success-600', icon: '✅' },
    { label: 'Declined', value: stats.declined, color: 'from-danger-500 to-danger-600', icon: '❌' },
    { label: 'Checked Out', value: stats.checked_out, color: 'from-slate-500 to-slate-600', icon: '🚪' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reception Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage today's visitors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                {stat.value}
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Waiting Visitors */}
      {stats.waiting > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">⏳ Waiting Visitors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitors.filter((v) => v.status === 'waiting').map((v) => (
              <VisitorCard key={v._id} visitor={v} role="receptionist" showActions={false} />
            ))}
          </div>
        </div>
      )}

      {/* Approved Visitors */}
      {stats.approved > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">✅ Approved / Checked-In</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitors.filter((v) => v.status === 'approved').map((v) => (
              <VisitorCard
                key={v._id}
                visitor={v}
                role="receptionist"
                onCheckout={handleCheckout}
                onViewPass={setSelectedVisitor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Declined */}
      {stats.declined > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">❌ Declined</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitors.filter((v) => v.status === 'declined').map((v) => (
              <VisitorCard key={v._id} visitor={v} role="receptionist" showActions={false} />
            ))}
          </div>
        </div>
      )}

      {/* Checked Out */}
      {stats.checked_out > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">🚪 Checked Out</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitors.filter((v) => v.status === 'checked_out').map((v) => (
              <VisitorCard key={v._id} visitor={v} role="receptionist" showActions={false} />
            ))}
          </div>
        </div>
      )}

      {visitors.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <p className="text-5xl mb-3">🏢</p>
          <p className="text-lg font-semibold text-slate-600">No visitors today</p>
          <p className="text-sm text-slate-400 mt-1">Register a new visitor to get started</p>
        </div>
      )}

      {/* QR Pass Modal */}
      {selectedVisitor && (
        <QRPassModal visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />
      )}
    </div>
  );
}
