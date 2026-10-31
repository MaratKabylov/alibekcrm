'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Deal } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { X, Calendar, DollarSign, Building2, User, Package, FileText, CheckCircle2 } from 'lucide-react';

interface DealModalProps {
  deal?: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuoteBuilder?: (dealId: string) => void;
}

export function DealModal({ deal, isOpen, onClose, onOpenQuoteBuilder }: DealModalProps) {
  const { addDeal, updateDeal, companies, contacts, stages, pipelines, activePipelineId, quotes } = useCRM();

  const dealQuote = deal ? quotes.find(q => q.deal_id === deal.id) : null;
  const quoteItems = dealQuote?.current_version?.items || [];
  const quoteCharges = dealQuote?.current_version?.charges || [];

  const [title, setTitle] = useState(deal?.title || '');
  const [pipelineId, setPipelineId] = useState(deal?.pipeline_id || activePipelineId || pipelines[0]?.id || '');
  const [companyId, setCompanyId] = useState(deal?.company_id || companies[0]?.id || '');
  const [contactId, setContactId] = useState(deal?.contact_id || '');

  const availableStages = stages
    .filter(s => s.pipeline_id === pipelineId)
    .sort((a, b) => a.stage_order - b.stage_order);

  const [stageId, setStageId] = useState(deal?.stage_id || availableStages[0]?.id || stages[0]?.id || '');
  const [amount, setAmount] = useState(deal?.amount || 0);
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal?.expected_close_date || '');
  const [notes, setNotes] = useState(deal?.notes || '');

  if (!isOpen) return null;

  // Фильтрация контактов по выбранной компании
  const filteredContacts = contacts.filter(c => !companyId || c.company_id === companyId);

  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId);
    const pipeStages = stages
      .filter(s => s.pipeline_id === newPipeId)
      .sort((a, b) => a.stage_order - b.stage_order);
    if (pipeStages.length > 0) {
      setStageId(pipeStages[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyId) {
      alert('Укажите название сделки и компанию');
      return;
    }

    if (deal) {
      updateDeal(deal.id, {
        title,
        company_id: companyId,
        contact_id: contactId || null,
        pipeline_id: pipelineId,
        stage_id: stageId,
        amount: Number(amount) || 0,
        expected_close_date: expectedCloseDate || null,
        notes,
      });
    } else {
      addDeal({
        title,
        company_id: companyId,
        contact_id: contactId || null,
        pipeline_id: pipelineId,
        stage_id: stageId,
        amount: Number(amount) || 0,
        currency: 'KZT',
        expected_close_date: expectedCloseDate || null,
        notes,
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 17, color: 'var(--text-main)' }}>
            {deal ? 'Карточка сделки' : 'Новая сделка'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Название сделки *</label>
            <input
              type="text"
              required
              placeholder="Поставка стаканов 350 мл"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Компания *</label>
              <select
                className="select"
                required
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setContactId('');
                }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Основной контакт</label>
              <select
                className="select"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                <option value="">Без контакта</option>
                {filteredContacts.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Воронка продаж *</label>
              <select
                className="select"
                value={pipelineId}
                onChange={(e) => handlePipelineChange(e.target.value)}
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.is_default ? '(По умолчанию)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Стадия сделки</label>
              <select
                className="select"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
              >
                {availableStages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Сумма (KZT)</label>
              <input
                type="number"
                step={100}
                className="input"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label">Ожидаемая дата закрытия</label>
            <input
              type="date"
              className="input"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          {/* Состав КП / Товары сделки */}
          {deal && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                  <Package size={15} color="var(--primary)" />
                  <span>Состав КП / Продукция</span>
                </div>
                {dealQuote && (
                  <span className="badge badge-sky" style={{ fontSize: 10.5 }}>
                    {dealQuote.quote_number} (v{dealQuote.version})
                  </span>
                )}
              </div>

              {quoteItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {quoteItems.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12.5,
                        background: '#FFFFFF',
                        padding: '6px 10px',
                        borderRadius: 4,
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name_snapshot}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>({item.sku_snapshot})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.quantity.toLocaleString('ru-RU')} {item.unit_snapshot} × {formatCurrency(item.base_unit_price)}
                        </span>
                        <strong style={{ color: 'var(--primary)' }}>{formatCurrency(item.item_subtotal)}</strong>
                      </div>
                    </div>
                  ))}

                  {quoteCharges.length > 0 && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', padding: '2px 4px' }}>
                      Доплаты: {quoteCharges.map(c => `${c.name_snapshot} (${formatCurrency(c.total_charge)})`).join(', ')}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #E2E8F0', fontSize: 12 }}>
                    <span style={{ color: 'var(--emerald-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} color="var(--emerald-success)" />
                      <span>Итого по расчету КП:</span>
                    </span>
                    <strong style={{ color: 'var(--primary)', fontSize: 14 }}>
                      {formatCurrency(dealQuote?.current_version?.total_amount || 0)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>
                  Для этой сделки КП еще не создано. Нажмите «Рассчитать КП / Тираж» ниже.
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label className="label">Заметки по сделке</label>
            <textarea
              rows={2}
              className="textarea"
              placeholder="Детали переговоров, требования к тиражу..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {deal && onOpenQuoteBuilder && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ borderColor: 'var(--primary-border)', color: 'var(--primary)', background: 'var(--primary-light)' }}
                onClick={() => {
                  onClose();
                  onOpenQuoteBuilder(deal.id);
                }}
              >
                Рассчитать КП / Тираж
              </button>
            )}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                {deal ? 'Сохранить' : 'Создать сделку'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
