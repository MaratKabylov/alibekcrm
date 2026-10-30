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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Сделки и воронка продаж</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Всего в пайплайне: <strong style={{ color: '#F59E0B' }}>{formatCurrency(totalPipelineAmount)}</strong> ({deals.length} сделок)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Переключение вида Таблица / Канбан (ТЗ п. 3.4) */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setViewMode('kanban')}
                className="btn btn-sm"
                style={{
                  background: viewMode === 'kanban' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: viewMode === 'kanban' ? '#FCD34D' : '#94A3B8',
                  padding: '6px 12px'
                }}
              >
                <LayoutGrid size={15} />
                <span>Канбан</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="btn btn-sm"
                style={{
                  background: viewMode === 'table' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: viewMode === 'table' ? '#FCD34D' : '#94A3B8',
                  padding: '6px 12px'
                }}
              >
                <List size={15} />
                <span>Таблица</span>
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleCreateDeal}>
              <Plus size={16} />
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
                      <td style={{ fontWeight: 600 }}>{deal.title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={14} color="#F59E0B" />
                          <span>{comp?.name || '—'}</span>
                        </div>
                      </td>
                      <td>{cont ? `${cont.first_name} ${cont.last_name || ''}` : '—'}</td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            background: `${stage?.color}22`, 
                            color: stage?.color, 
                            borderColor: `${stage?.color}44` 
                          }}
                        >
                          {stage?.name}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#F59E0B' }}>
                        {formatCurrency(deal.amount)}
                      </td>
                      <td>
                        {deal.expected_close_date ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8' }}>
                            <Calendar size={13} />
                            <span suppressHydrationWarning>{new Date(deal.expected_close_date).toLocaleDateString('ru-RU')}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#FCD34D', borderColor: 'rgba(245, 158, 11, 0.3)' }}
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
