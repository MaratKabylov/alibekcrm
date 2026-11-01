'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/store';
import { AppNotification, NotificationType } from '@/types/database';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Trophy,
  XCircle,
  FileText,
  UserPlus,
  GitBranch,
  Info,
  ExternalLink,
  Settings,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике снаружи
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const urgentCount = notifications.filter(n => n.priority === 'urgent' || n.type === 'task_overdue').length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'urgent') return n.priority === 'urgent' || n.type === 'task_overdue';
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 45) return 'только что';
      if (diffMin < 60) return `${diffMin} мин. назад`;
      if (diffHours < 24) return `${diffHours} ч. назад`;
      if (diffDays === 1) return 'вчера';
      if (diffDays < 7) return `${diffDays} дн. назад`;
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_overdue':
        return {
          icon: <AlertTriangle size={15} color="#DC2626" />,
          bg: '#FEE2E2',
          border: '#FECACA',
          label: 'Просрочено',
          color: '#DC2626'
        };
      case 'task_due_today':
      case 'task_created':
        return {
          icon: <Clock size={15} color="#2563EB" />,
          bg: '#EFF6FF',
          border: '#BFDBFE',
          label: 'Задача',
          color: '#2563EB'
        };
      case 'task_completed':
        return {
          icon: <CheckCircle2 size={15} color="#059669" />,
          bg: '#ECFDF5',
          border: '#A7F3D0',
          label: 'Выполнено',
          color: '#059669'
        };
      case 'deal_won':
        return {
          icon: <Trophy size={15} color="#059669" />,
          bg: '#ECFDF5',
          border: '#A7F3D0',
          label: 'Победа',
          color: '#059669'
        };
      case 'deal_lost':
        return {
          icon: <XCircle size={15} color="#DC2626" />,
          bg: '#FEE2E2',
          border: '#FECACA',
          label: 'Сделка',
          color: '#DC2626'
        };
      case 'deal_stage_changed':
      case 'deal_created':
        return {
          icon: <GitBranch size={15} color="#4F46E5" />,
          bg: '#EEF2FF',
          border: '#C7D2FE',
          label: 'Сделка',
          color: '#4F46E5'
        };
      case 'lead_new':
      case 'lead_converted':
        return {
          icon: <UserPlus size={15} color="#7C3AED" />,
          bg: '#F5F3FF',
          border: '#DDD6FE',
          label: 'Лид',
          color: '#7C3AED'
        };
      case 'quote_status':
      case 'quote_created':
      case 'quote_expired':
        return {
          icon: <FileText size={15} color="#D97706" />,
          bg: '#FEF3C7',
          border: '#FDE68A',
          label: 'КП',
          color: '#D97706'
        };
      default:
        return {
          icon: <Info size={15} color="#475569" />,
          bg: '#F1F5F9',
          border: '#CBD5E1',
          label: 'Инфо',
          color: '#475569'
        };
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Кнопка-колокольчик в шапке */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{
          width: 36,
          height: 36,
          padding: 0,
          borderRadius: 'var(--radius-sm)',
          position: 'relative',
          backgroundColor: isOpen ? '#EFF6FF' : undefined,
          borderColor: isOpen ? 'var(--primary)' : undefined,
        }}
        title={`Уведомления на сайте (${unreadNotificationsCount} непрочитанных)`}
        aria-label="Открыть центр уведомлений"
      >
        <Bell size={16} color={unreadNotificationsCount > 0 ? 'var(--primary)' : 'var(--text-secondary)'} />

        {unreadNotificationsCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              background: urgentCount > 0 ? 'var(--rose-danger, #EF4444)' : 'var(--primary, #2563EB)',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              animation: urgentCount > 0 ? 'pulse 1.8s infinite' : 'none'
            }}
          >
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Выпадающее окно центра уведомлений */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 420,
            maxWidth: '92vw',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md, 10px)',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--border-subtle, #E2E8F0)',
            zIndex: 1100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 560,
          }}
        >
          {/* Шапка дропдауна */}
          <div
            style={{
              padding: '12px 16px',
              background: '#F8FAFC',
              borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} color="var(--primary)" />
              <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>Уведомления на сайте</strong>
              {unreadNotificationsCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    background: 'var(--primary-light, #EFF6FF)',
                    color: 'var(--primary, #2563EB)',
                    border: '1px solid var(--primary-border, #BFDBFE)',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {unreadNotificationsCount} новых
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '4px 8px', height: 26, gap: 4 }}
                  title="Отметить все прочитанными"
                >
                  <CheckCheck size={13} />
                  <span>Прочитать все</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Закрыть"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Вкладки фильтров */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 14px',
              background: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            {[
              { id: 'all', label: 'Все', count: notifications.length },
              { id: 'unread', label: 'Непрочитанные', count: unreadNotificationsCount },
              { id: 'urgent', label: 'Срочные', count: urgentCount },
            ].map(tab => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  style={{
                    border: 'none',
                    background: active ? 'var(--primary-light, #EFF6FF)' : 'transparent',
                    color: active ? 'var(--primary, #2563EB)' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 500,
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        background: active ? '#BFDBFE' : '#F1F5F9',
                        color: active ? '#1D4ED8' : 'var(--text-muted)',
                        padding: '1px 5px',
                        borderRadius: 8,
                        fontWeight: 700,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Список уведомлений */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: 380,
              flex: 1,
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}
                >
                  <CheckCircle2 size={22} color="#10B981" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  {filter === 'unread' ? 'Нет новых непрочитанных уведомлений' : 'Уведомлений пока нет'}
                </div>
                <div style={{ fontSize: 12 }}>
                  {filter === 'unread'
                    ? 'Все задачи и сделки проверены, отличная работа!'
                    : 'Оповещения будут появляться здесь при создании лидов, смене этапов сделок и дедлайнах задач.'}
                </div>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const conf = getNotificationIcon(notif.type);
                const isUrgent = notif.priority === 'urgent' || notif.type === 'task_overdue';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      gap: 12,
                      cursor: notif.link ? 'pointer' : 'default',
                      borderBottom: '1px solid #F1F5F9',
                      background: notif.is_read ? '#FFFFFF' : '#F8FAFC',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = notif.is_read ? '#FFFFFF' : '#F8FAFC')}
                  >
                    {/* Индикатор непрочитанного */}
                    {!notif.is_read && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 4,
                          top: 16,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isUrgent ? '#DC2626' : 'var(--primary, #2563EB)',
                        }}
                      />
                    )}

                    {/* Иконка типа */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: conf.bg,
                        border: `1px solid ${conf.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {conf.icon}
                    </div>

                    {/* Тело уведомления */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: conf.color,
                              background: conf.bg,
                              padding: '1px 5px',
                              borderRadius: 4,
                              flexShrink: 0,
                            }}
                          >
                            {conf.label}
                          </span>
                          <strong
                            style={{
                              fontSize: 12.5,
                              color: isUrgent ? '#991B1B' : 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {notif.title}
                          </strong>
                        </div>

                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          margin: '3px 0 0',
                          wordBreak: 'break-word',
                        }}
                      >
                        {notif.message}
                      </p>

                      {/* Нижняя строчка с быстрыми действиями */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 6,
                        }}
                      >
                        {notif.link ? (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              fontWeight: 500,
                            }}
                          >
                            <span>Перейти</span>
                            <ExternalLink size={11} />
                          </span>
                        ) : <span />}

                        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                          {!notif.is_read ? (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 11,
                              }}
                              title="Отметить как прочитанное"
                            >
                              <Check size={12} />
                              <span>Прочитано</span>
                            </button>
                          ) : null}

                          <button
                            onClick={() => deleteNotification(notif.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Удалить уведомление"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Подвал дропдауна */}
          <div
            style={{
              padding: '10px 14px',
              background: '#F8FAFC',
              borderTop: '1px solid var(--border-subtle, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              Только на сайте (без email)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Очистить журнал
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings#notifications');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Settings size={12} />
                <span>Настройки</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

