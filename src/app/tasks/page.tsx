'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { TaskModal } from '@/components/TaskModal';
import { Task } from '@/types/database';
import { Plus, CheckSquare, Clock, AlertCircle, Phone, MessageSquare, Building2 } from 'lucide-react';

export default function TasksPage() {
  const { tasks, companies, deals, toggleTaskStatus } = useCRM();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [now, setNow] = useState<Date | null>(null);
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    const current = new Date();
    setNow(current);
    setTodayStr(current.toISOString().split('T')[0]);
  }, []);

  const filteredTasks = tasks.filter(task => {
    const isCompleted = task.status === 'completed';
    const isOverdue = now ? (!isCompleted && new Date(task.due_date) < now) : false;
    const isToday = todayStr ? (!isCompleted && task.due_date.startsWith(todayStr)) : false;

    if (activeFilter === 'today') return isToday;
    if (activeFilter === 'overdue') return isOverdue;
    if (activeFilter === 'completed') return isCompleted;
    return true;
  });

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Задачи и контроль звонков</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Контроль выполнения дедлайнов, звонки клиентам и отправка сообщений
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            <span>Новая задача</span>
          </button>
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'all', label: 'Все задачи', count: tasks.length },
            { id: 'today', label: 'На сегодня', count: todayStr ? tasks.filter(t => t.status === 'pending' && t.due_date.startsWith(todayStr)).length : 0 },
            { id: 'overdue', label: 'Просроченные', count: now ? tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < now).length : 0 },
            { id: 'completed', label: 'Выполненные', count: tasks.filter(t => t.status === 'completed').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className="btn btn-secondary btn-sm"
              style={{
                background: activeFilter === tab.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: activeFilter === tab.id ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
                color: activeFilter === tab.id ? '#FCD34D' : '#94A3B8',
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '1px 6px',
                borderRadius: 8,
                fontSize: 11
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Список задач */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isOverdue = now ? (!isCompleted && new Date(task.due_date) < now) : false;
            const company = companies.find(c => c.id === task.company_id);
            const deal = deals.find(d => d.id === task.deal_id);

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: 18,
                  background: isCompleted ? 'rgba(255, 255, 255, 0.01)' : isOverdue ? 'rgba(244, 63, 94, 0.05)' : 'var(--bg-card)',
                  borderColor: isOverdue ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => toggleTaskStatus(task.id)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#10B981' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: isCompleted ? '#64748B' : '#FFF',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, fontSize: 12, color: '#94A3B8' }}>
                    {company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building2 size={13} color="#F59E0B" />
                        <span>{company.name}</span>
                      </div>
                    )}
                    {deal && (
                      <span style={{ color: '#CBD5E1' }}>Сделка: {deal.title}</span>
                    )}
                    <span 
                      suppressHydrationWarning 
                      style={{ color: isOverdue ? '#FDA4AF' : '#94A3B8', fontWeight: isOverdue ? 700 : 400 }}
                    >
                      Срок: {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOverdue && (
                      <span className="badge badge-rose" style={{ fontSize: 10 }}>Просрочено</span>
                    )}
                  </div>
                </div>

                {company?.phone && (
                  <a
                    href={`https://wa.me/${company.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#6EE7B7', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
              Нет задач в данном фильтре
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <TaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
