'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { formatCurrency } from '@/lib/calculator';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  FileText, 
  Phone, 
  MessageSquare,
  ArrowRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { TaskModal } from '@/components/TaskModal';

export default function DashboardPage() {
  const router = useRouter();
  const { deals, leads, tasks, companies, stages, toggleTaskStatus } = useCRM();

  // Состояния модалок
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  // Метрики
  const wonStage = stages.find(s => s.is_won);
  const lostStage = stages.find(s => s.is_lost);

  const activeDeals = deals.filter(d => d.stage_id !== wonStage?.id && d.stage_id !== lostStage?.id);
  const activeDealsAmount = activeDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const wonDeals = deals.filter(d => d.stage_id === wonStage?.id);
  const wonDealsAmount = wonDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const newLeads = leads.filter(l => l.status === 'new');

  // Фильтрация задач по сроку (ТЗ п. 3.5: выделять просроченные и задачи на сегодня)
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = currentDate ? pendingTasks.filter(t => new Date(t.due_date) < currentDate) : [];

  const handleQuickAction = (action: 'lead' | 'deal' | 'quote' | 'company') => {
    if (action === 'lead') router.push('/leads/new');
    if (action === 'deal') router.push('/deals/new');
    if (action === 'company') router.push('/companies/new');
    if (action === 'quote') setQuoteModalOpen(true);
  };

  return (
    <>
      <Header onQuickAction={handleQuickAction} />

      <div className="page-wrapper">
        {/* Приветствие и быстрые действия */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Обзор продаж и показатели</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Управление заказами упаковки, поставками и задачами {currentDate ? `на ${currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              id="dash-quick-quote-btn"
              className="btn btn-primary" 
              onClick={() => setQuoteModalOpen(true)}
            >
              <FileText size={15} />
              <span>Рассчитать тираж / КП</span>
            </button>
            <button 
              id="dash-quick-task-btn"
              className="btn btn-secondary" 
              onClick={() => setTaskModalOpen(true)}
            >
              <Plus size={15} />
              <span>Новая задача</span>
            </button>
          </div>
        </div>

        {/* Сетка ключевых показателей (KPI Metrics) */}
        <div className="metrics-grid">
          {/* Сделки в воронке */}
          <div className="metric-card">
            <div className="metric-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Сделки в воронке</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {formatCurrency(activeDealsAmount)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                {activeDeals.length} активных сделок
              </div>
            </div>
          </div>

          {/* Выиграно за период */}
          <div className="metric-card">
            <div className="metric-icon-box" style={{ background: 'var(--emerald-light)', color: 'var(--emerald-dark)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Закрыто успешно</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {formatCurrency(wonDealsAmount)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--emerald-dark)', fontWeight: 600, marginTop: 2 }}>
                {wonDeals.length} выигранных заказов
              </div>
            </div>
          </div>

          {/* Новые лиды */}
          <div className="metric-card">
            <div className="metric-icon-box" style={{ background: '#EEF2FF', color: '#4338CA' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Новые обращения</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {newLeads.length}
              </div>
              <div style={{ fontSize: 11, color: '#4338CA', fontWeight: 600, marginTop: 2 }}>
                Требуют квалификации
              </div>
            </div>
          </div>

          {/* Просроченные задачи */}
          <div 
            className="metric-card" 
            style={overdueTasks.length > 0 ? { borderColor: 'var(--rose-border)', background: '#FFFDFD' } : {}}
          >
            <div className="metric-icon-box" style={{ background: 'var(--rose-light)', color: 'var(--rose-dark)' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Просроченные задачи</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: overdueTasks.length > 0 ? 'var(--rose-dark)' : 'var(--text-main)', marginTop: 2 }}>
                {overdueTasks.length}
              </div>
              <div style={{ fontSize: 11, color: overdueTasks.length > 0 ? 'var(--rose-dark)' : 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>
                {pendingTasks.length} всего в ожидании
              </div>
            </div>
          </div>
        </div>

        {/* Двухколоночный макет: Сделки в работе + Задачи на сегодня */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Левая колонка: Активные сделки */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 15 }}>Сделки в работе</h3>
              </div>
              <Link 
                href="/deals" 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12 }}
              >
                <span>Канбан-доска</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeDeals.slice(0, 5).map(deal => {
                const comp = companies.find(c => c.id === deal.company_id);
                const stage = stages.find(s => s.id === deal.stage_id);

                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)' }}>{deal.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        {comp && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <Building2 size={13} color="var(--primary)" />
                            <span>{comp.name}</span>
                          </div>
                        )}
                        {stage && (
                          <span 
                            className="badge" 
                            style={{ 
                              background: `${stage.color}18`, 
                              color: stage.color, 
                              borderColor: `${stage.color}40`,
                              fontSize: 11
                            }}
                          >
                            {stage.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--primary)' }}>
                        {formatCurrency(deal.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {deal.expected_close_date ? `До ${new Date(deal.expected_close_date).toLocaleDateString('ru-RU')}` : 'Без срока'}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {activeDeals.length === 0 && (
                <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Нет активных сделок. Создайте сделку или сконвертируйте лид.
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка: Задачи на сегодня и контроль звонков */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 15 }}>Задачи и звонки</h3>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setTaskModalOpen(true)}
                style={{ fontSize: 12 }}
              >
                <Plus size={13} />
                <span>Добавить</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(task => {
                const isOverdue = currentDate ? (task.status === 'pending' && new Date(task.due_date) < currentDate) : false;
                const company = companies.find(c => c.id === task.company_id);

                return (
                  <div
                    key={task.id}
                    style={{
                      background: task.status === 'completed' 
                        ? '#F8FAFC' 
                        : isOverdue ? '#FFF5F5' : '#FFFFFF',
                      border: isOverdue ? '1px solid var(--rose-border)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      style={{ marginTop: 3, cursor: 'pointer', accentColor: 'var(--emerald-success)' }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                        {company && <span>{company.name}</span>}
                        <span 
                          suppressHydrationWarning 
                          style={{ color: isOverdue ? 'var(--rose-dark)' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}
                        >
                          {new Date(task.due_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}, {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                        {isOverdue && (
                          <span style={{ color: 'var(--rose-dark)', fontWeight: 700 }}>Просрочено!</span>
                        )}
                      </div>

                      {/* Кнопка WhatsApp по ТЗ п. 1 */}
                      {company?.phone && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={`https://wa.me/${company.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '2px 8px',
                              fontSize: 11,
                              color: 'var(--emerald-dark)',
                              borderColor: 'var(--emerald-border)',
                              background: 'var(--emerald-light)'
                            }}
                          >
                            <MessageSquare size={11} />
                            <span>WhatsApp ({company.phone})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Все задачи выполнены!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модалки */}
      {quoteModalOpen && (
        <QuoteBuilderModal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
        />
      )}

      {taskModalOpen && (
        <TaskModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
        />
      )}
    </>
  );
}
