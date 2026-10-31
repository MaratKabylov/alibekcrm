'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Lead, LeadStatus } from '@/types/database';
import { X, ArrowRight, Building2, User, Phone, Mail, MessageSquare, AlertTriangle } from 'lucide-react';

interface LeadModalProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadModal({ lead, isOpen, onClose }: LeadModalProps) {
  const { addLead, updateLead, convertLead, companies, contacts, pipelines, activePipelineId } = useCRM();

  const [name, setName] = useState(lead?.name || '');
  const [companyName, setCompanyName] = useState(lead?.company_name || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [interestedProducts, setInterestedProducts] = useState(lead?.interested_products || '');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'new');
  const [junkReason, setJunkReason] = useState(lead?.junk_reason || '');

  // Режим конвертации
  const [isConverting, setIsConverting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [createDeal, setCreateDeal] = useState(true);
  const [conversionPipelineId, setConversionPipelineId] = useState(activePipelineId || pipelines[0]?.id || '');
  const [dealTitle, setDealTitle] = useState('');

  if (!isOpen) return null;

  // Проверка дублей по телефону по ТЗ п. 3.3
  const normalizedPhone = phone.replace(/\D/g, '');
  const duplicateContact = normalizedPhone.length >= 7 
    ? contacts.find(c => c.phone_normalized.includes(normalizedPhone) || normalizedPhone.includes(c.phone_normalized))
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Укажите имя или название лида');
      return;
    }

    if (lead) {
      updateLead(lead.id, {
        name,
        company_name: companyName,
        phone,
        phone_normalized: normalizedPhone,
        email,
        interested_products: interestedProducts,
        notes,
        status,
        junk_reason: status === 'junk' ? junkReason : null,
      });
    } else {
      addLead({
        name,
        company_name: companyName,
        phone,
        phone_normalized: normalizedPhone,
        email,
        interested_products: interestedProducts,
        notes,
        status,
        junk_reason: status === 'junk' ? junkReason : null,
      });
    }
    onClose();
  };

  const handleConvert = () => {
    if (!lead) return;
    try {
      convertLead(lead.id, {
        createDeal,
        dealTitle: dealTitle || `Поставка: ${lead.company_name || lead.name}`,
        existingCompanyId: selectedCompanyId || undefined,
        pipelineId: conversionPipelineId,
      });
      alert('Лид успешно сконвертирован в компанию, контакт и сделку!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка конвертации');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 17, color: 'var(--text-main)' }}>
            {isConverting 
              ? 'Конвертация лида в сделку и клиента' 
              : lead ? 'Редактирование лида' : 'Новый лид'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* ПРЕДУПРЕЖДЕНИЕ О ВОЗМОЖНОМ ДУБЛЕ ПО ТЕЛЕФОНУ (ТЗ п. 3.3) */}
        {duplicateContact && !lead?.converted_at && (
          <div style={{
            background: 'var(--amber-light)',
            border: '1px solid var(--amber-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertTriangle size={18} color="var(--amber-warning)" />
            <div style={{ fontSize: 12, color: 'var(--amber-dark)' }}>
              <strong>Внимание!</strong> Найден контакт с похожим номером: <strong>{duplicateContact.first_name}</strong> ({duplicateContact.phone}).
            </div>
          </div>
        )}

        {isConverting ? (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              При конвертации будет создан контакт <strong>{lead?.name}</strong> и привязана компания.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Привязать к существующей компании или создать новую:</label>
              <select
                className="select"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">+ Создать новую компанию ({companyName || name})</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-main)' }}>
                <input
                  type="checkbox"
                  checked={createDeal}
                  onChange={(e) => setCreateDeal(e.target.checked)}
                />
                Создать сделку сразу при конвертации
              </label>
            </div>

            {createDeal && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label className="label">Воронка продаж</label>
                  <select
                    className="select"
                    value={conversionPipelineId}
                    onChange={(e) => setConversionPipelineId(e.target.value)}
                  >
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.is_default ? '(По умолчанию)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Название сделки</label>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Сделка: ${companyName || name}`}
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setIsConverting(false)}>
                Назад
              </button>
              <button className="btn btn-success" onClick={handleConvert}>
                Выполнить конвертацию
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">Имя контакта *</label>
                <input
                  type="text"
                  required
                  placeholder="Данияр"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Компания / Кофейня</label>
                <input
                  type="text"
                  placeholder="Coffee & Go"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">Телефон</label>
                <input
                  type="text"
                  placeholder="+7 (701) 123-45-67"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  placeholder="info@coffee.kz"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="label">Интересующие товары</label>
              <input
                type="text"
                placeholder="Стаканы 350 мл, крышки D90, брендирование..."
                className="input"
                value={interestedProducts}
                onChange={(e) => setInterestedProducts(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">Статус лида</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                >
                  <option value="new">Новый</option>
                  <option value="in_progress">В работе</option>
                  <option value="qualified">Квалифицирован</option>
                  <option value="junk">Нецелевой</option>
                </select>
              </div>
              {status === 'junk' && (
                <div>
                  <label className="label">Причина нецелевого лида *</label>
                  <input
                    type="text"
                    required
                    placeholder="Спам / Физлицо / Не наш профиль"
                    className="input"
                    value={junkReason}
                    onChange={(e) => setJunkReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Заметки / Комментарий</label>
              <textarea
                rows={2}
                placeholder="Дополнительные пожелания клиента..."
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {lead && lead.status !== 'qualified' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderColor: '#10B981', color: '#6EE7B7' }}
                    onClick={() => setIsConverting(true)}
                  >
                    <ArrowRight size={15} />
                    <span>Сконвертировать лид</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {lead ? 'Сохранить' : 'Создать лид'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
