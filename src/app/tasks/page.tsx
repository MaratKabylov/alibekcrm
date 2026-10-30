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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Задачи и контроль звонков</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Контроль выполнения дедлайнов, звонки клиентам и отправка сообщений
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            <span>Новая задача</span>
          </button>
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {[
            { id: 'all', label: 'Все задачи', count: tasks.length },
            { id: 'today', label: 'На сегодня', count: todayStr ? tasks.filter(t => t.status === 'pending' && t.due_date.startsWith(todayStr)).length : 0 },
            { id: 'overdue', label: 'Просроченные', count: now ? tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < now).length : 0 },
            { id: 'completed', label: 'Выполненные', count: tasks.filter(t => t.status === 'completed').length },
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: isActive ? 'var(--primary-light)' : '#FFFFFF',
                  borderColor: isActive ? 'var(--primary-border)' : 'var(--border-subtle)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: isActive ? 'var(--primary-border)' : '#F1F5F9',
                  color: isActive ? 'var(--primary-hover)' : 'var(--text-muted)',
                  padding: '1px 6px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Список задач */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  padding: 16,
                  background: isCompleted ? '#F8FAFC' : isOverdue ? '#FFF5F5' : '#FFFFFF',
                  borderColor: isOverdue ? 'var(--rose-border)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => toggleTaskStatus(task.id)}
                  style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--emerald-success)' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-main)' }}>
                        <Building2 size={13} color="var(--primary)" />
                        <span>{company.name}</span>
                      </div>
                    )}
                    {deal && (
                      <span style={{ color: 'var(--text-secondary)' }}>Сделка: {deal.title}</span>
                    )}
                    <span 
                      suppressHydrationWarning 
                      style={{ color: isOverdue ? 'var(--rose-dark)' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}
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
                    style={{ 
                      color: 'var(--emerald-dark)', 
                      borderColor: 'var(--emerald-border)',
                      background: 'var(--emerald-light)'
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
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
