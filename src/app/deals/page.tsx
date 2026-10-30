'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { DealModal } from '@/components/DealModal';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { Deal } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { Plus, LayoutGrid, List, Building2, Calendar, FileText } from 'lucide-react';

export default function DealsPage() {
  const { deals, stages, companies, contacts } = useCRM();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [activeQuoteDealId, setActiveQuoteDealId] = useState<string>('');

  const totalPipelineAmount = deals
    .filter(d => !stages.find(s => s.id === d.stage_id)?.is_lost)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const handleOpenDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setDealModalOpen(true);
  };

  const handleCreateDeal = () => {
    setSelectedDeal(null);
    setDealModalOpen(true);
  };

  const handleOpenQuoteBuilder = (dealId: string) => {
    setActiveQuoteDealId(dealId);
    setQuoteModalOpen(true);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Сделки и воронка продаж</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Всего в пайплайне: <strong style={{ color: 'var(--primary)' }}>{formatCurrency(totalPipelineAmount)}</strong> ({deals.length} сделок)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Переключение вида Таблица / Канбан (ТЗ п. 3.4) */}
            <div style={{ 
              display: 'flex', 
              background: '#E2E8F0', 
              borderRadius: 'var(--radius-sm)', 
              padding: 2, 
              border: '1px solid var(--border-subtle)' 
            }}>
              <button
                onClick={() => setViewMode('kanban')}
                className="btn btn-sm"
                style={{
                  background: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  boxShadow: viewMode === 'kanban' ? 'var(--shadow-sm)' : 'none',
                  fontWeight: viewMode === 'kanban' ? 700 : 500,
                  border: 'none'
                }}
              >
                <LayoutGrid size={14} />
                <span>Канбан</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="btn btn-sm"
                style={{
                  background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                  fontWeight: viewMode === 'table' ? 700 : 500,
                  border: 'none'
                }}
              >
                <List size={14} />
                <span>Таблица</span>
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleCreateDeal}>
              <Plus size={15} />
              <span>Создать сделку</span>
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <KanbanBoard onOpenDeal={handleOpenDeal} onCreateDeal={handleCreateDeal} />
        ) : (
          /* ТАБЛИЧНОЕ ПРЕДСТАВЛЕНИЕ (ТЗ п. 3.4) */
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Название сделки</th>
                  <th>Компания / Клиент</th>
                  <th>Основной контакт</th>
                  <th>Стадия</th>
                  <th>Сумма (KZT)</th>
                  <th>Ожидаемое закрытие</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => {
                  const comp = companies.find(c => c.id === deal.company_id);
                  const cont = contacts.find(c => c.id === deal.contact_id);
                  const stage = stages.find(s => s.id === deal.stage_id);

                  return (
                    <tr key={deal.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDeal(deal)}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{deal.title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)' }}>
                          <Building2 size={14} color="var(--primary)" />
                          <span>{comp?.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {cont ? `${cont.first_name} ${cont.last_name || ''}` : '—'}
                      </td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            background: `${stage?.color}18`, 
                            color: stage?.color, 
                            borderColor: `${stage?.color}40` 
                          }}
                        >
                          {stage?.name}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatCurrency(deal.amount)}
                      </td>
                      <td>
                        {deal.expected_close_date ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                            <Calendar size={13} />
                            <span suppressHydrationWarning>{new Date(deal.expected_close_date).toLocaleDateString('ru-RU')}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                          onClick={() => handleOpenQuoteBuilder(deal.id)}
                        >
                          <FileText size={13} />
                          <span>КП</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dealModalOpen && (
        <DealModal
          deal={selectedDeal}
          isOpen={dealModalOpen}
          onClose={() => setDealModalOpen(false)}
          onOpenQuoteBuilder={handleOpenQuoteBuilder}
        />
      )}

      {quoteModalOpen && (
        <QuoteBuilderModal
          dealId={activeQuoteDealId}
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
        />
      )}
    </>
  );
}
