import React from 'react';
import { VisitorStatus } from '../types';

interface StatusBadgeProps {
  status: VisitorStatus;
  className?: string;
}

const statusConfig: Record<VisitorStatus, { label: string; classes: string }> = {
  waiting: {
    label: 'Waiting',
    classes: 'bg-warning-50 text-warning-600 ring-1 ring-warning-500/20',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-success-50 text-success-600 ring-1 ring-success-500/20',
  },
  declined: {
    label: 'Declined',
    classes: 'bg-danger-50 text-danger-600 ring-1 ring-danger-500/20',
  },
  checked_out: {
    label: 'Checked Out',
    classes: 'bg-slate-100 text-slate-600 ring-1 ring-slate-300/50',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.waiting;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}
