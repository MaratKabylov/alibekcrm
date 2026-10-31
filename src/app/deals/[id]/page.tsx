'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { formatCurrency } from '@/lib/calculator';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Calendar, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Save,
  Check,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';

function DealDetailContent() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  const { deals, stages, pipelines, companies, contacts, quotes, tasks, updateDeal, updateDealStage, addTask, toggleTaskStatus } = useCRM();

  const deal = deals.find(d => d.id === dealId);

  // Form states
  const [title, setTitle] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [stageId, setStageId] = useState('');
  const [amount, setAmount] = useState(0);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  // Quote modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskType, setNewTaskType] = useState<'call' | 'message' | 'meeting' | 'other'>('call');

  useEffect(() => {
    if (deal) {
      setTitle(deal.title || '');
      const defaultPipeId = deal.pipeline_id || stages.find(s => s.id === deal.stage_id)?.pipeline_id || pipelines[0]?.id || '';
      setPipelineId(defaultPipeId);
      setCompanyId(deal.company_id || '');
      setContactId(deal.contact_id || '');
      setStageId(deal.stage_id || '');
      setAmount(deal.amount || 0);
      setExpectedCloseDate(deal.expected_close_date || '');
      setNotes(deal.notes || '');
      setLossReason(deal.loss_reason || '');
    }
  }, [deal]);

  if (!deal) {
    return (
      <>
        <Header />
        <div className="page-wrapper">
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={44} color="var(--rose-danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Сделка не найдена</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Возможно, сделка была удалена или перенесена в архив.
            </p>
            <Link href="/deals" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Вернуться к воронке</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const selectedCompany = companies.find(c => c.id === companyId);
  const filteredContacts = contacts.filter(c => !companyId || c.company_id === companyId);
  const currentPipeline = pipelines.find(p => p.id === pipelineId) || pipelines[0];
  const pipelineStages = stages
    .filter(s => s.pipeline_id === (currentPipeline?.id || ''))
    .sort((a, b) => a.stage_order - b.stage_order);
  const currentStage = stages.find(s => s.id === stageId);
  const dealQuotes = quotes.filter(q => q.deal_id === deal.id);
  const dealTasks = tasks.filter(t => t.deal_id === deal.id);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !companyId) {
      alert('Укажите название сделки и компанию');
      return;
    }

    updateDeal(deal.id, {
      title,
      company_id: companyId,
      contact_id: contactId || null,
      pipeline_id: pipelineId,
      stage_id: stageId,
      amount: Number(amount) || 0,
      expected_close_date: expectedCloseDate || null,
      notes,
      loss_reason: currentStage?.is_lost ? lossReason : null,
    });

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleStageClick = (newStageId: string) => {
    const targetStage = stages.find(s => s.id === newStageId);
    if (targetStage?.is_lost) {
      const reason = prompt('Укажите причину проигрыша сделки (ТЗ п. 3.4):', lossReason || '');
      if (reason === null) return;
      if (!reason.trim()) {
        alert('Причина проигрыша обязательна.');
        return;
      }
      setLossReason(reason.trim());
      setStageId(newStageId);
      updateDealStage(deal.id, newStageId, reason.trim());
    } else {
      setStageId(newStageId);
      updateDealStage(deal.id, newStageId);
    }
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      task_type: newTaskType,
      due_date: newTaskDueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      deal_id: deal.id,
      company_id: companyId || undefined,
      contact_id: contactId || undefined,
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Верхняя навигация и заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/deals" className="btn btn-secondary btn-sm" title="Назад к канбану">
              <ArrowLeft size={15} />
              <span>К воронке сделок</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Сделка:</span>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>
                {title || deal.title}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {savedNotification && (
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px' }}>
                <Check size={14} />
                <span>Сохранено</span>
              </span>
            )}
            <button 
              type="button" 
              onClick={() => setQuoteModalOpen(true)}
              className="btn btn-secondary"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)', background: 'var(--primary-light)' }}
            >
              <FileText size={15} />
              <span>Рассчитать КП / Тираж</span>
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              <Save size={15} />
              <span>Сохранить</span>
            </button>
          </div>
        </div>

        {/* Воронка стадий (Pipeline Bar) */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 20, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>Воронка: <strong style={{ color: 'var(--primary)' }}>{currentPipeline?.name}</strong></span>
            <span>Статус: <strong style={{ color: currentStage?.color }}>{currentStage?.name}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 680 }}>
            {pipelineStages.map((stage) => {
              const isCurrent = stage.id === stageId;
              const isPassed = !currentStage?.is_lost && (stage.stage_order <= (currentStage?.stage_order || 0));

              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageClick(stage.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: isCurrent 
                      ? `2px solid ${stage.color}` 
                      : '1px solid var(--border-subtle)',
                    background: isCurrent 
                      ? `${stage.color}15` 
                      : isPassed ? '#F1F5F9' : '#FFFFFF',
                    color: isCurrent ? stage.color : isPassed ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 700 : 500,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: stage.color,
                  }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{stage.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Основная сетка: Параметры слева + Связанные сущности справа */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Левая колонка: Форма параметров сделки */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
              Параметры сделки
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Название сделки *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Поставка стаканов 350 мл"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Воронка продаж *</label>
                  <select
                    className="select"
                    value={pipelineId}
                    onChange={(e) => {
                      const newPipeId = e.target.value;
                      setPipelineId(newPipeId);
                      const pStages = stages.filter(s => s.pipeline_id === newPipeId).sort((a, b) => a.stage_order - b.stage_order);
                      if (pStages.length > 0 && !pStages.some(s => s.id === stageId)) {
                        setStageId(pStages[0].id);
                      }
                    }}
                  >
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.is_default ? '(По умолчанию)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Текущий статус / этап</label>
                  <select
                    className="select"
                    value={stageId}
                    onChange={(e) => handleStageClick(e.target.value)}
                  >
                    {pipelineStages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label className="label" style={{ margin: 0 }}>Компания *</label>
                    {companyId && (
                      <Link 
                        href={`/companies/${companyId}`} 
                        style={{ fontSize: 11, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                      >
                        <span>В карточку</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label className="label" style={{ margin: 0 }}>Основной контакт</label>
                    {contactId && (
                      <Link 
                        href={`/contacts/${contactId}`} 
                        style={{ fontSize: 11, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                      >
                        <span>В контакт</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Сумма сделки (KZT)</label>
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

                <div>
                  <label className="label">Ожидаемая дата закрытия</label>
                  <input
                    type="date"
                    className="input"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                  />
                </div>
              </div>

              {currentStage?.is_lost && (
                <div style={{ marginBottom: 16, background: 'var(--rose-light)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rose-border)' }}>
                  <label className="label" style={{ color: 'var(--rose-dark)' }}>
                    Причина проигрыша (ТЗ п. 3.4) *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="Например: Дорого, выбрали другого поставщика, отложили закуп"
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label className="label">Заметки и договоренности</label>
                <textarea
                  rows={4}
                  className="textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Условия доставки, требования к брендированию, цветности, слоям..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} />
                  <span>Сохранить изменения</span>
                </button>
              </div>
            </form>
          </div>

          {/* Правая колонка: Связанные КП и Задачи */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Блок КП */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Коммерческие предложения</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                >
                  <Plus size={13} />
                  <span>Создать КП</span>
                </button>
              </div>

              {dealQuotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dealQuotes.map(q => (
                    <div
                      key={q.id}
                      style={{
                        padding: 12,
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        background: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-main)' }}>
                            {q.quote_number}
                          </span>
                          <span className="badge badge-sky" style={{ fontSize: 10 }}>
                            v{q.version}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                          Статус: <strong style={{ color: 'var(--text-secondary)' }}>{q.status}</strong> • {new Date(q.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                          {formatCurrency(q.current_version?.total_amount || 0)}
                        </span>
                        <a
                          href={`/api/quotes/${q.id}/pdf?inline=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Открыть PDF"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
                  <p>Для этой сделки еще не сформировано КП.</p>
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 10 }}
                  >
                    Рассчитать первый тираж
                  </button>
                </div>
              )}
            </div>

            {/* Блок задач по сделке */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Задачи по сделке</h3>
                </div>
                <span className="badge" style={{ background: '#F1F5F9' }}>
                  {dealTasks.filter(t => t.status === 'pending').length} в работе
                </span>
              </div>

              {/* Список задач */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {dealTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      background: task.status === 'completed' ? '#F8FAFC' : '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--emerald-success)' }}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)',
                    }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}

                {dealTasks.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    Нет активных задач по сделке
                  </div>
                )}
              </div>

              {/* Быстрое добавление задачи */}
              <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    required
                    placeholder="Новая задача (например: позвонить бариста)..."
                    className="input"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={{ fontSize: 12.5, height: 34 }}
                  />
                  <select
                    className="select"
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    style={{ width: 110, fontSize: 12, height: 34 }}
                  >
                    <option value="call">Звонок</option>
                    <option value="message">WhatsApp</option>
                    <option value="meeting">Встреча</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="date"
                    className="input"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    style={{ width: 150, fontSize: 12, height: 32 }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ height: 32 }}>
                    <Plus size={13} />
                    <span>Добавить</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {quoteModalOpen && (
        <QuoteBuilderModal
          dealId={deal.id}
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
        />
      )}
    </>
  );
}

export default function DealDetailPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="page-wrapper"><div className="card">Загрузка карточки сделки...</div></div>
      </>
    }>
      <DealDetailContent />
    </Suspense>
  );
}
