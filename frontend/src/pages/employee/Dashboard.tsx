import React, { useState, useEffect, useCallback } from 'react';
import { getVisitors, approveVisitor, declineVisitor } from '../../api/endpoints';
import { Visitor } from '../../types';
import VisitorCard from '../../components/VisitorCard';
import QRPassModal from '../../components/QRPassModal';
import { useWebSocket } from '../../context/WebSocketContext';

export default function EmployeeDashboard() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { notifications } = useWebSocket();

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await getVisitors({ today_only: false });
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

  // Refresh when new notifications arrive (new visitor)
  useEffect(() => {
    if (notifications.length > 0) {
      fetchVisitors();
    }
  }, [notifications.length, fetchVisitors]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await approveVisitor(id);
      // Show the QR pass immediately
      setSelectedVisitor(res.data);
      fetchVisitors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve visitor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    if (!confirm('Are you sure you want to decline this visitor?')) return;
    setActionLoading(id);
    try {
      await declineVisitor(id);
      fetchVisitors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to decline visitor');
    } finally {
      setActionLoading(null);
    }
  };

  const waitingVisitors = visitors.filter((v) => v.status === 'waiting');
  const approvedVisitors = visitors.filter((v) => v.status === 'approved');
  const recentVisitors = visitors.filter((v) => v.status === 'declined' || v.status === 'checked_out').slice(0, 6);

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
        <h1 className="text-2xl font-bold text-slate-800">Employee Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your visitor requests</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center text-lg">⏳</div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{waitingVisitors.length}</p>
              <p className="text-xs text-slate-500 font-medium">Waiting</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-lg">✅</div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{approvedVisitors.length}</p>
              <p className="text-xs text-slate-500 font-medium">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-lg">👥</div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{visitors.length}</p>
              <p className="text-xs text-slate-500 font-medium">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Visitors */}
      {waitingVisitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            ⏳ Waiting for Your Approval
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-warning-500 text-white rounded-full">
              {waitingVisitors.length}
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {waitingVisitors.map((v) => (
              <VisitorCard
                key={v._id}
                visitor={v}
                role="employee"
                onApprove={handleApprove}
                onDecline={handleDecline}
                onViewPass={setSelectedVisitor}
              />
            ))}
          </div>
        </div>
      )}

      {waitingVisitors.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-base font-semibold text-slate-600">No pending visitors</p>
          <p className="text-sm text-slate-400 mt-1">You'll be notified when someone arrives</p>
        </div>
      )}

      {/* Approved Visitors */}
      {approvedVisitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">✅ Approved Visitors</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {approvedVisitors.map((v) => (
              <VisitorCard
                key={v._id}
                visitor={v}
                role="employee"
                showActions={true}
                onViewPass={setSelectedVisitor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentVisitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">📋 Recent Activity</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {recentVisitors.map((v) => (
              <VisitorCard
                key={v._id}
                visitor={v}
                role="employee"
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* QR Pass Modal */}
      {selectedVisitor && (
        <QRPassModal visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />
      )}
    </div>
  );
}
