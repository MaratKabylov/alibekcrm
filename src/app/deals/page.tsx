'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { KanbanBoard } from '@/components/KanbanBoard';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { PipelineSettingsModal } from '@/components/PipelineSettingsModal';
import { Deal } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Building2, 
  Calendar, 
  FileText, 
  GitBranch, 
  Sliders, 
  Settings,
  Layers,
  ChevronDown,
  Package
} from 'lucide-react';

export default function DealsPage() {
  const router = useRouter();
  const { deals, stages, pipelines, activePipelineId, setActivePipelineId, companies, contacts, quotes } = useCRM();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [activeQuoteDealId, setActiveQuoteDealId] = useState<string>('');

  // Модалка настройки воронок и статусов
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'pipelines' | 'stages'>('pipelines');
  const [targetStageIdForModal, setTargetStageIdForModal] = useState<string | undefined>(undefined);

  const currentPipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
  const pipelineStages = stages
    .filter(s => s.pipeline_id === (currentPipeline?.id || ''))
    .sort((a, b) => a.stage_order - b.stage_order);

  // Сделки активной воронки
  const currentPipelineDeals = deals.filter(d => 
    d.pipeline_id === currentPipeline?.id || pipelineStages.some(s => s.id === d.stage_id)
  );

  const totalPipelineAmount = currentPipelineDeals
    .filter(d => !stages.find(s => s.id === d.stage_id)?.is_lost)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const handleOpenDeal = (deal: Deal) => {
    router.push(`/deals/${deal.id}`);
  };

  const handleCreateDeal = () => {
    router.push('/deals/new');
  };

  const handleOpenQuoteBuilder = (dealId: string) => {
    setActiveQuoteDealId(dealId);
    setQuoteModalOpen(true);
  };

  const handleOpenPipelineSettings = (stageId?: string) => {
    setTargetStageIdForModal(stageId);
    setSettingsInitialTab(stageId ? 'stages' : 'stages');
    setSettingsModalOpen(true);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Заголовок страницы и переключатель видов */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Сделки и воронка продаж</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              В воронке <strong>«{currentPipeline?.name}»</strong>: <strong style={{ color: 'var(--primary)' }}>{formatCurrency(totalPipelineAmount)}</strong> ({currentPipelineDeals.length} сделок)
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

        {/* Панель переключения воронок и настройки этапов */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Кнопки переключения воронок */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
              <GitBranch size={15} color="var(--primary)" />
              <span>Воронка:</span>
            </span>
            {pipelines.map(pipe => {
              const isActive = pipe.id === (currentPipeline?.id);
              const pStages = stages.filter(s => s.pipeline_id === pipe.id);
              const count = deals.filter(d => d.pipeline_id === pipe.id || pStages.some(s => s.id === d.stage_id)).length;

              return (
                <button
                  key={pipe.id}
                  type="button"
                  onClick={() => setActivePipelineId(pipe.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'var(--primary)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : 'var(--text-main)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{pipe.name}</span>
                  <span style={{
                    fontSize: 11,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : '#475569',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontWeight: 600
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Кнопки управления воронками и статусами */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSettingsInitialTab('stages');
                setSettingsModalOpen(true);
              }}
              style={{ gap: 6 }}
              title="Добавить или настроить статусы текущей воронки"
            >
              <Sliders size={13} />
              <span>Настроить статусы ({pipelineStages.length})</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSettingsInitialTab('pipelines');
                setSettingsModalOpen(true);
              }}
              style={{ gap: 6 }}
              title="Управление всеми воронками продаж"
            >
              <GitBranch size={13} />
              <span>Все воронки ({pipelines.length})</span>
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <KanbanBoard 
            pipelineId={currentPipeline?.id}
            onOpenDeal={handleOpenDeal} 
            onCreateDeal={handleCreateDeal} 
            onOpenPipelineSettings={handleOpenPipelineSettings}
          />
        ) : (
          /* ТАБЛИЧНОЕ ПРЕДСТАВЛЕНИЕ (ТЗ п. 3.4) */
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Название сделки</th>
                  <th>Компания / Клиент</th>
                  <th>Состав КП / Продукция</th>
                  <th>Основной контакт</th>
                  <th>Стадия</th>
                  <th>Сумма (KZT)</th>
                  <th>Ожидаемое закрытие</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {currentPipelineDeals.map(deal => {
                  const comp = companies.find(c => c.id === deal.company_id);
                  const cont = contacts.find(c => c.id === deal.contact_id);
                  const stage = stages.find(s => s.id === deal.stage_id);
                  const dealQuote = quotes.find(q => q.deal_id === deal.id);
                  const quoteItems = dealQuote?.current_version?.items || [];

                  return (
                    <tr key={deal.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDeal(deal)}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{deal.title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)' }}>
                          <Building2 size={14} color="var(--primary)" />
                          <span>{comp?.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {quoteItems.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {quoteItems.map(item => (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <Package size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name_snapshot}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 11.5 }}>
                                  ({item.quantity.toLocaleString('ru-RU')} {item.unit_snapshot})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {deal.notes ? (
                              <span title={deal.notes} style={{ color: 'var(--text-secondary)' }}>
                                {deal.notes.length > 35 ? deal.notes.slice(0, 35) + '...' : deal.notes}
                              </span>
                            ) : '—'}
                          </span>
                        )}
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

                {currentPipelineDeals.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                      В этой воронке продаж пока нет сделок. Нажмите «Создать сделку», чтобы добавить первую.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка настроек воронок и статусов */}
      {settingsModalOpen && (
        <PipelineSettingsModal
          isOpen={settingsModalOpen}
          initialTab={settingsInitialTab}
          targetPipelineId={currentPipeline?.id}
          onClose={() => setSettingsModalOpen(false)}
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
