'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/store';
import { 
  AlertTriangle, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  GitBranch, 
  UserPlus, 
  FileText, 
  Info, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { NotificationType } from '@/types/database';

export function NotificationToaster() {
  const router = useRouter();
  const { toasts, dismissToast, markAsRead } = useCRM();

  if (!toasts || toasts.length === 0) return null;

  const getToastIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_overdue':
        return <AlertTriangle size={18} color="#DC2626" />;
      case 'deal_won':
        return <Trophy size={18} color="#059669" />;
      case 'task_due_today':
      case 'task_created':
        return <Clock size={18} color="#2563EB" />;
      case 'task_completed':
        return <CheckCircle2 size={18} color="#059669" />;
      case 'deal_stage_changed':
      case 'deal_created':
        return <GitBranch size={18} color="#4F46E5" />;
      case 'lead_new':
      case 'lead_converted':
        return <UserPlus size={18} color="#7C3AED" />;
      case 'quote_status':
      case 'quote_created':
      case 'quote_expired':
        return <FileText size={18} color="#D97706" />;
      default:
        return <Info size={18} color="#2563EB" />;
    }
  };

  const getBorderColor = (type: NotificationType, priority: string) => {
    if (priority === 'urgent' || type === 'task_overdue') return '#EF4444';
    if (type === 'deal_won') return '#10B981';
    if (type === 'lead_new' || type === 'lead_converted') return '#8B5CF6';
    if (type.startsWith('quote_')) return '#F59E0B';
    return '#2563EB';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 10,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => {
        const isUrgent = toast.priority === 'urgent' || toast.type === 'task_overdue';
        const borderColor = getBorderColor(toast.type, toast.priority);

        return (
          <div
            key={toast.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 10,
              boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.16), 0 6px 12px -3px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              borderLeft: `5px solid ${borderColor}`,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              pointerEvents: 'auto',
              animation: 'slideInRight 0.25s ease-out',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ marginTop: 2, flexShrink: 0 }}>
              {getToastIcon(toast.type)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <strong
                  style={{
                    fontSize: 13,
                    color: isUrgent ? '#991B1B' : 'var(--text-main, #1E293B)',
                    lineHeight: 1.3,
                  }}
                >
                  {toast.title}
                </strong>

                <button
                  onClick={() => dismissToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #94A3B8)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Закрыть"
                >
                  <X size={14} />
                </button>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary, #475569)',
                  margin: '4px 0 0',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}
              >
                {toast.message}
              </p>

              {toast.link && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => {
                      markAsRead(toast.id);
                      dismissToast(toast.id);
                      router.push(toast.link!);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11, height: 24, padding: '2px 8px', gap: 4 }}
                  >
                    <span>Открыть</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

