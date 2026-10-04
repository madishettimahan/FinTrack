import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../services/api';
import { AppNotification } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function Notifications() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await get<AppNotification[]>('/notifications');
      setNotifications(res || []);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 shrink-0" />;
    }
  };

  const getCardStyle = (level: string) => {
    switch (level) {
      case 'danger':
        return 'border-rose-200 bg-rose-50/40';
      case 'warning':
        return 'border-amber-200 bg-amber-50/40';
      case 'success':
        return 'border-emerald-200 bg-emerald-50/40';
      default:
        return 'border-blue-200 bg-blue-50/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
        <p className="text-sm text-slate-500">
          Automated budget warnings, upcoming subscription bills, and savings milestones
        </p>
      </div>

      {/* Notifications List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-slate-400" />}
            title="All caught up!"
            message="You have no pending alerts or notifications at this time."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 transition-colors ${getCardStyle(
                  notif.level
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(notif.level)}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{notif.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                  </div>
                </div>

                {notif.link && (
                  <Link
                    to={notif.link}
                    className="self-end sm:self-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 shrink-0"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
