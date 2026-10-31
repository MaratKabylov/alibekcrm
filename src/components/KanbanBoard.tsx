'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Deal, DealStage } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { 
  Building2, 
  Calendar, 
  MoreVertical, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  Tag,
  FileText
} from 'lucide-react';

interface KanbanBoardProps {
  onOpenDeal?: (deal: Deal) => void;
  onCreateDeal?: () => void;
  pipelineId?: string;
  onOpenPipelineSettings?: (stageId?: string) => void;
}

export function KanbanBoard({ onOpenDeal, onCreateDeal, pipelineId, onOpenPipelineSettings }: KanbanBoardProps) {
  const { deals, stages, pipelines, activePipelineId, companies, contacts, quotes, updateDealStage } = useCRM();
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  
  // Рефы и состояние для горизонтальной прокрутки
  const boardRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Модалка причины проигрыша
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null);
  const [pendingLostStageId, setPendingLostStageId] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState('');

  const currentPipeId = pipelineId || activePipelineId || pipelines[0]?.id || '';
  const currentStages = stages
    .filter(s => s.pipeline_id === currentPipeId)
    .sort((a, b) => a.stage_order - b.stage_order);

  // Проверка возможности скролла
  const checkScroll = () => {
    if (boardRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = boardRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = boardRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [currentStages.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (boardRef.current) {
      const scrollAmount = 340;
      boardRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Горизонтальный скролл колесиком мыши вне карточек
  const handleWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    const isOverCards = target.closest('.kanban-cards');
    if (!isOverCards && e.deltaY !== 0 && boardRef.current) {
      boardRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (!draggedDealId) return;

    const targetStage = stages.find(s => s.id === stageId);
    
    // Если перетаскиваем в "Проиграна" — требуем причину по ТЗ п. 3.4 и 10.4
    if (targetStage?.is_lost) {
      setPendingLostDealId(draggedDealId);
      setPendingLostStageId(stageId);
      setLossModalOpen(true);
    } else {
      updateDealStage(draggedDealId, stageId);
    }

    setDraggedDealId(null);
  };

  const handleConfirmLoss = () => {
    if (!pendingLostDealId || !lossReason.trim()) {
      alert('Пожалуйста, укажите причину проигрыша сделки.');
      return;
    }

    const lostStage = (pendingLostStageId && stages.find(s => s.id === pendingLostStageId)) || 
                      currentStages.find(s => s.is_lost) || 
                      stages.find(s => s.is_lost);

    if (lostStage) {
      updateDealStage(pendingLostDealId, lostStage.id, lossReason.trim());
    }
    
    setLossModalOpen(false);
    setPendingLostDealId(null);
    setPendingLostStageId(null);
    setLossReason('');
  };

  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
      {/* Верхняя строка навигации по этапам */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        padding: '2px 4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span>Статусов в воронке: <strong style={{ color: 'var(--text-main)' }}>{currentStages.length}</strong></span>
          {currentStages.length > 3 && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                Для перемещения используйте горизонтальный скролл или кнопки навигации
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            style={{
              padding: '4px 8px',
              opacity: canScrollLeft ? 1 : 0.45,
              cursor: canScrollLeft ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Прокрутить воронку влево"
          >
            <ChevronLeft size={14} />
            <span style={{ fontSize: 11.5 }}>Влево</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            style={{
              padding: '4px 8px',
              opacity: canScrollRight ? 1 : 0.45,
              cursor: canScrollRight ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Прокрутить воронку вправо"
          >
            <span style={{ fontSize: 11.5 }}>Вправо</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Обертка Канбан-доски с поддержкой плавного скролла и плавающих стрелок */}
      <div className="kanban-board-container" onWheel={handleWheel}>
        {/* Плавающая левая кнопка прокрутки */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            style={{
              position: 'absolute',
              left: -8,
              top: '40%',
              transform: 'translateY(-50%)',
              zIndex: 35,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
            title="Прокрутить влево"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Плавающая правая кнопка прокрутки */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            style={{
              position: 'absolute',
              right: -8,
              top: '40%',
              transform: 'translateY(-50%)',
              zIndex: 35,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
            title="Прокрутить вправо"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div className="kanban-board" ref={boardRef}>
          {currentStages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage_id === stage.id && !d.is_archived);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

            return (
              <div
                key={stage.id}
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Шапка колонки */}
                <div className="kanban-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: stage.color
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                      {stage.name}
                    </span>
                    <span style={{
                      fontSize: 11,
                      background: '#CBD5E1',
                      padding: '2px 7px',
                      borderRadius: 10,
                      color: '#334155',
                      fontWeight: 600
                    }}>
                      {stageDeals.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {formatCurrency(stageTotal)}
                    </span>
                    {onOpenPipelineSettings && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPipelineSettings(stage.id);
                        }}
                        title="Настроить статус"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 2,
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 4
                        }}
                      >
                        <Sliders size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Карточки в колонке */}
                <div className="kanban-cards">
                  {stageDeals.map((deal) => {
                    const company = companies.find(c => c.id === deal.company_id);
                    const contact = contacts.find(c => c.id === deal.contact_id);
                    const dealQuote = quotes.find(q => q.deal_id === deal.id);
                    const quoteItems = dealQuote?.current_version?.items || [];

                    return (
                      <div
                        key={deal.id}
                        className="kanban-card"
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        onClick={() => onOpenDeal && onOpenDeal(deal)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                            {deal.title}
                          </h4>
                        </div>

                        {company && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            <Building2 size={13} style={{ color: 'var(--primary)' }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {company.name}
                            </span>
                          </div>
                        )}

                        {/* Состав КП / По какому продукту обращался клиент */}
                        {quoteItems.length > 0 ? (
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11.5,
                              background: '#F1F5F9',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              color: '#334155',
                              marginBottom: 8,
                              border: '1px solid #E2E8F0',
                            }}
                            title={quoteItems.map(i => `${i.name_snapshot}: ${i.quantity.toLocaleString('ru-RU')} ${i.unit_snapshot} (${formatCurrency(i.item_subtotal)})`).join('\n')}
                          >
                            <Package size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <span style={{ 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              fontWeight: 500,
                              flex: 1
                            }}>
                              {quoteItems[0].name_snapshot}
                            </span>
                            <span style={{ 
                              fontWeight: 700, 
                              color: 'var(--primary)', 
                              fontSize: 11,
                              flexShrink: 0,
                              background: '#FFFFFF',
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid #CBD5E1'
                            }}>
                              {quoteItems[0].quantity.toLocaleString('ru-RU')} {quoteItems[0].unit_snapshot}
                            </span>
                            {quoteItems.length > 1 && (
                              <span style={{ 
                                fontSize: 10, 
                                color: '#64748B', 
                                fontWeight: 700,
                                flexShrink: 0,
                                background: '#E2E8F0',
                                padding: '1px 4px',
                                borderRadius: 4
                              }}>
                                +{quoteItems.length - 1}
                              </span>
                            )}
                          </div>
                        ) : deal.notes ? (
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              marginBottom: 8,
                              background: '#FAFAFA',
                              padding: '3px 7px',
                              borderRadius: 4,
                              border: '1px dashed #E2E8F0'
                            }}
                            title={deal.notes}
                          >
                            <Tag size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {deal.notes}
                            </span>
                          </div>
                        ) : null}

                        {deal.loss_reason && stage.is_lost && (
                          <div style={{
                            fontSize: 11,
                            color: 'var(--rose-dark)',
                            background: 'var(--rose-light)',
                            padding: '4px 8px',
                            borderRadius: 4,
                            marginBottom: 8,
                            border: '1px solid var(--rose-border)'
                          }}>
                            Причина: {deal.loss_reason}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                            {formatCurrency(deal.amount)}
                          </span>
                          {deal.expected_close_date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                              <Calendar size={12} />
                              <span suppressHydrationWarning>{new Date(deal.expected_close_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {stageDeals.length === 0 && (
                    <div style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      border: '1px dashed #CBD5E1',
                      borderRadius: 6
                    }}>
                      Перетащите сделку сюда
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Быстрое добавление статуса в конец Канбан-доски */}
          {onOpenPipelineSettings && (
            <div
              onClick={() => onOpenPipelineSettings()}
              style={{
                flex: '0 0 160px',
                width: 160,
                minWidth: 160,
                border: '2px dashed #CBD5E1',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '24px 10px',
                height: 'fit-content',
                color: 'var(--primary)',
                transition: 'all 0.2s ease',
                marginTop: 0
              }}
              title="Добавить новый статус в эту воронку"
            >
              <Plus size={20} />
              <span style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4, textAlign: 'center' }}>
                Добавить статус
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Модалка обязательного указания причины проигрыша сделки по ТЗ п. 3.4 */}
      {lossModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={20} color="var(--rose-danger)" />
                <h3 style={{ fontSize: 16, color: 'var(--text-main)' }}>Причина проигрыша сделки</h3>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              По регламенту CRM для перевода сделки в статус «Проиграна» необходимо зафиксировать причину.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Причина отказа / проигрыша *</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Например: Дорого, выбрали другого поставщика, отложили открытие..."
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setLossModalOpen(false);
                  setPendingLostDealId(null);
                  setPendingLostStageId(null);
                  setLossReason('');
                }}
              >
                Отмена
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmLoss}
              >
                Подтвердить проигрыш
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
