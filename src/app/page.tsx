'use client';

import React, { useState, useEffect } from 'react';
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
import { LeadModal } from '@/components/LeadModal';
import { DealModal } from '@/components/DealModal';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { TaskModal } from '@/components/TaskModal';

export default function DashboardPage() {
  const { deals, leads, tasks, companies, stages, toggleTaskStatus } = useCRM();

  // Состояния модалок
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);
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
    if (action === 'lead') setLeadModalOpen(true);
    if (action === 'deal') setDealModalOpen(true);
    if (action === 'quote') setQuoteModalOpen(true);
  };

  return (
    <>
      <Header onQuickAction={handleQuickAction} />

      <div className="page-wrapper">
        {/* Приветствие и быстрые действия */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Обзор продаж и показатели</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Управление заказами упаковки, поставками и задачами {currentDate ? `на ${currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              id="dash-quick-quote-btn"
              className="btn btn-primary" 
              onClick={() => setQuoteModalOpen(true)}
            >
              <FileText size={16} />
              <span>Рассчитать тираж / КП</span>
            </button>
            <button 
              id="dash-quick-task-btn"
              className="btn btn-secondary" 
              onClick={() => setTaskModalOpen(true)}
            >
              <Plus size={16} />
              <span>Новая задача</span>
            </button>
          </div>
        </div>

        {/* Сетка ключевых показателей (KPI Metrics) */}
        <div className="metrics-grid">
          {/* Сделки в воронке */}
          <div className="metric-card">
            <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Сделки в воронке</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginTop: 2 }}>
                {formatCurrency(activeDealsAmount)}
              </div>
              <div style={{ fontSize: 11, color: '#FCD34D', marginTop: 2 }}>
                {activeDeals.length} активных сделок
              </div>
            </div>
          </div>

          {/* Выиграно за период */}
          <div className="metric-card">
            <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Закрыто успешно</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginTop: 2 }}>
                {formatCurrency(wonDealsAmount)}
              </div>
              <div style={{ fontSize: 11, color: '#6EE7B7', marginTop: 2 }}>
                {wonDeals.length} выигранных заказов
              </div>
            </div>
          </div>

          {/* Новые лиды */}
          <div className="metric-card">
            <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Новые обращения</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginTop: 2 }}>
                {newLeads.length}
              </div>
              <div style={{ fontSize: 11, color: '#A5B4FC', marginTop: 2 }}>
                Требуют квалификации
              </div>
            </div>
          </div>

          {/* Просроченные задачи */}
          <div className="metric-card" style={overdueTasks.length > 0 ? { borderColor: 'rgba(244, 63, 94, 0.4)' } : {}}>
            <div className="metric-icon-box" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Просроченные задачи</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: overdueTasks.length > 0 ? '#FDA4AF' : '#FFF', marginTop: 2 }}>
                {overdueTasks.length}
              </div>
              <div style={{ fontSize: 11, color: '#FDA4AF', marginTop: 2 }}>
                {pendingTasks.length} всего в ожидании
              </div>
            </div>
          </div>
        </div>

        {/* Двухколоночный макет: Сделки в работе + Задачи на сегодня */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Левая колонка: Активные сделки */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#F59E0B" />
                <h3 style={{ fontSize: 16 }}>Сделки в работе</h3>
              </div>
              <Link 
                href="/deals" 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, color: '#CBD5E1' }}
              >
                <span>Канбан-доска</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeDeals.slice(0, 5).map(deal => {
                const comp = companies.find(c => c.id === deal.company_id);
                const stage = stages.find(s => s.id === deal.stage_id);

                return (
                  <div
                    key={deal.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{deal.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        {comp && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                            <Building2 size={13} color="#F59E0B" />
                            <span>{comp.name}</span>
                          </div>
                        )}
                        {stage && (
                          <span 
                            className="badge" 
                            style={{ 
                              background: `${stage.color}22`, 
                              color: stage.color, 
                              borderColor: `${stage.color}44`,
                              fontSize: 11
                            }}
                          >
                            {stage.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>
                        {formatCurrency(deal.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        {deal.expected_close_date ? `До ${new Date(deal.expected_close_date).toLocaleDateString('ru-RU')}` : 'Без срока'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeDeals.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  Нет активных сделок. Создайте сделку или сконвертируйте лид.
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка: Задачи на сегодня и контроль звонков */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#F59E0B" />
                <h3 style={{ fontSize: 16 }}>Задачи и звонки</h3>
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
                        ? 'rgba(255, 255, 255, 0.01)' 
                        : isOverdue ? 'rgba(244, 63, 94, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                      border: isOverdue ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      style={{ marginTop: 3, cursor: 'pointer', accentColor: '#10B981' }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: task.status === 'completed' ? '#64748B' : '#FFF',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11, color: '#94A3B8' }}>
                        {company && <span>{company.name}</span>}
                        <span style={{ color: isOverdue ? '#FDA4AF' : '#64748B', fontWeight: isOverdue ? 700 : 400 }}>
                          {new Date(task.due_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}, {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                        {isOverdue && (
                          <span style={{ color: '#F43F5E', fontWeight: 700 }}>Просрочено!</span>
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
                              color: '#6EE7B7',
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                              background: 'rgba(16, 185, 129, 0.08)'
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
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  Все задачи выполнены!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модалки */}
      {leadModalOpen && (
        <LeadModal
          isOpen={leadModalOpen}
          onClose={() => setLeadModalOpen(false)}
        />
      )}

      {dealModalOpen && (
        <DealModal
          isOpen={dealModalOpen}
          onClose={() => setDealModalOpen(false)}
          onOpenQuoteBuilder={(dId) => setQuoteModalOpen(true)}
        />
      )}

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
