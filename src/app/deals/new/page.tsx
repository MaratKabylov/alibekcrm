'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { formatCurrency } from '@/lib/calculator';
import { ArrowLeft, Save, Plus } from 'lucide-react';

function NewDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('company_id') || '';
  const initialContactId = searchParams.get('contact_id') || '';

  const { addDeal, companies, contacts, stages, pipelines, activePipelineId } = useCRM();

  const [title, setTitle] = useState('');
  const [pipelineId, setPipelineId] = useState(activePipelineId || pipelines[0]?.id || '');
  const [companyId, setCompanyId] = useState(initialCompanyId || companies[0]?.id || '');
  const [contactId, setContactId] = useState(initialContactId || '');

  const availableStages = stages
    .filter(s => s.pipeline_id === pipelineId)
    .sort((a, b) => a.stage_order - b.stage_order);

  const [stageId, setStageId] = useState(availableStages[0]?.id || stages[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');

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
      alert('Укажите название сделки и выберите компанию');
      return;
    }

    const created = addDeal({
      title: title.trim(),
      company_id: companyId,
      contact_id: contactId || null,
      pipeline_id: pipelineId,
      stage_id: stageId,
      amount: Number(amount) || 0,
      currency: 'KZT',
      expected_close_date: expectedCloseDate || null,
      notes,
    });

    // Переходим в созданную сделку
    router.push(`/deals/${created.id}`);
  };

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label className="label">Название сделки *</label>
          <input
            type="text"
            required
            placeholder="Поставка стаканов 350 мл с логотипом"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label className="label">Компания / Клиент *</label>
            <select
              className="select"
              required
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setContactId('');
              }}
            >
              <option value="">Выберите компанию</option>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label className="label">Воронка продаж *</label>
            <select
              className="select"
              required
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label className="label">Сумма (KZT)</label>
            <input
              type="number"
              step={100}
              className="input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="label">Ожидаемая дата закрытия</label>
          <input
            type="date"
            className="input"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="label">Заметки и комментарии</label>
          <textarea
            rows={3}
            className="textarea"
            placeholder="Тираж, пожелания клиента, требования к брендированию..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Link href="/deals" className="btn btn-secondary">
            Отмена
          </Link>
          <button type="submit" className="btn btn-primary">
            <Plus size={15} />
            <span>Создать сделку</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewDealPage() {
  return (
    <>
      <Header />
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/deals" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К воронке сделок</span>
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Создание новой сделки</h1>
          </div>
        </div>

        <Suspense fallback={<div className="card">Загрузка...</div>}>
          <NewDealForm />
        </Suspense>
      </div>
    </>
  );
}
