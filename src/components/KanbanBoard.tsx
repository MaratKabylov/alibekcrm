'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Deal } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { Building2, Calendar, MoreVertical, AlertCircle, Plus, CheckCircle2, XCircle } from 'lucide-react';

interface KanbanBoardProps {
  onOpenDeal?: (deal: Deal) => void;
  onCreateDeal?: () => void;
}

export function KanbanBoard({ onOpenDeal, onCreateDeal }: KanbanBoardProps) {
  const { deals, stages, companies, contacts, updateDealStage } = useCRM();
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  
  // Модалка причины проигрыша
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState('');

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

    const lostStage = stages.find(s => s.is_lost);
    if (lostStage) {
      updateDealStage(pendingLostDealId, lostStage.id, lossReason.trim());
    }
    
    setLossModalOpen(false);
    setPendingLostDealId(null);
    setLossReason('');
  };

  return (
    <div>
      <div className="kanban-board">
        {stages.map((stage) => {
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
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: stage.color
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                    {stage.name}
                  </span>
                  <span style={{
                    fontSize: 11,
                    background: 'rgba(255,255,255,0.08)',
                    padding: '2px 7px',
                    borderRadius: 10,
                    color: '#94A3B8'
                  }}>
                    {stageDeals.length}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>
                  {formatCurrency(stageTotal)}
                </span>
              </div>

              {/* Карточки в колонке */}
              <div className="kanban-cards">
                {stageDeals.map((deal) => {
                  const company = companies.find(c => c.id === deal.company_id);
                  const contact = contacts.find(c => c.id === deal.contact_id);

                  return (
                    <div
                      key={deal.id}
                      className="kanban-card"
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onClick={() => onOpenDeal && onOpenDeal(deal)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.3 }}>
                          {deal.title}
                        </h4>
                      </div>

                      {company && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>
                          <Building2 size={13} style={{ color: '#F59E0B' }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {company.name}
                          </span>
                        </div>
                      )}

                      {deal.loss_reason && stage.is_lost && (
                        <div style={{
                          fontSize: 11,
                          color: '#FDA4AF',
                          background: 'rgba(244,63,94,0.1)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          marginBottom: 8,
                          border: '1px solid rgba(244,63,94,0.2)'
                        }}>
                          Причина: {deal.loss_reason}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>
                          {formatCurrency(deal.amount)}
                        </span>
                        {deal.expected_close_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B' }}>
                            <Calendar size={12} />
                            <span>{new Date(deal.expected_close_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
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
                    color: '#475569',
                    fontSize: 12,
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: 8
                  }}>
                    Перетащите сделку сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Модалка обязательного указания причины проигрыша сделки по ТЗ п. 3.4 */}
      {lossModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={20} color="#F43F5E" />
                <h3 style={{ fontSize: 16 }}>Причина проигрыша сделки</h3>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
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
