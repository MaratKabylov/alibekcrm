'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { formatCurrency } from '@/lib/calculator';
import { downloadQuotePDF, previewQuotePDF } from '@/lib/pdf/download';
import { Quote, QuoteStatus } from '@/types/database';
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
  Package,
  Layers,
  Download,
  Eye,
  CreditCard,
  Truck,
  Sparkles,
  Printer,
  Tag,
  Phone,
  Mail,
  Edit3,
  Loader2
} from 'lucide-react';

function DealDetailContent() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  const { 
    deals, 
    stages, 
    pipelines, 
    companies, 
    contacts, 
    quotes, 
    tasks, 
    settings, 
    updateDeal, 
    updateDealStage, 
    addTask, 
    toggleTaskStatus 
  } = useCRM();

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

  // Quote modal and active quote selection
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  const dealQuotes = quotes.filter(q => q.deal_id === dealId);

  useEffect(() => {
    if (dealQuotes.length > 0) {
      if (!selectedQuoteId || !dealQuotes.some(q => q.id === selectedQuoteId)) {
        setSelectedQuoteId(dealQuotes[0].id);
      }
    }
  }, [dealQuotes, selectedQuoteId]);

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
  const selectedContact = contacts.find(c => c.id === contactId);
  const filteredContacts = contacts.filter(c => !companyId || c.company_id === companyId);
  const currentPipeline = pipelines.find(p => p.id === pipelineId) || pipelines[0];
  const pipelineStages = stages
    .filter(s => s.pipeline_id === (currentPipeline?.id || ''))
    .sort((a, b) => a.stage_order - b.stage_order);
  const currentStage = stages.find(s => s.id === stageId);
  const dealTasks = tasks.filter(t => t.deal_id === deal.id);

  // Active selected quote and its composition
  const activeQuote = dealQuotes.find(q => q.id === selectedQuoteId) || dealQuotes[0];
  const activeVersion = activeQuote?.current_version;
  const quoteItems = activeVersion?.items || [];
  const quoteCharges = activeVersion?.charges || [];

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

  const handlePreviewPdf = async (q: Quote) => {
    try {
      setDownloadingPdf(true);
      await previewQuotePDF(q, settings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Попробуйте позже';
      alert(`Ошибка предпросмотра PDF: ${msg}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPdf = async (q: Quote) => {
    try {
      setDownloadingPdf(true);
      await downloadQuotePDF(q, settings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Попробуйте позже';
      alert(`Ошибка скачивания PDF: ${msg}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getQuoteStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-sky">Черновик</span>;
      case 'ready':
        return <span className="badge badge-amber">Готово к отправке</span>;
      case 'sent':
        return <span className="badge badge-indigo">Отправлено клиенту</span>;
      case 'accepted':
        return <span className="badge badge-emerald">Принято заказчиком</span>;
      case 'rejected':
        return <span className="badge badge-rose">Отклонено</span>;
      case 'expired':
        return <span className="badge" style={{ background: '#F1F5F9', color: 'var(--text-muted)' }}>Истекло</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Верхняя навигация и заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/deals" className="btn btn-secondary btn-sm" title="Назад к воронке">
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
              <span>Сохранить параметры</span>
            </button>
          </div>
        </div>

        {/* Информационная плашка: Клиент, Продукт обращения, Сумма */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: 14
        }}>
          {/* Клиент / Компания */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Клиент / Компания</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {selectedCompany?.name || 'Компания не выбрана'}
                {selectedCompany && (
                  <Link href={`/companies/${selectedCompany.id}`} title="В карточку компании" style={{ color: 'var(--primary)', display: 'inline-flex' }}>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Основной продукт обращения */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 260 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: '#EEF2FF',
              color: 'var(--indigo-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Package size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Продукт обращения</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {quoteItems.length > 0 ? (
                  <span style={{ color: 'var(--text-main)' }}>
                    {quoteItems[0].name_snapshot}
                    <strong style={{ color: 'var(--primary)', marginLeft: 5 }}>
                      ({quoteItems[0].quantity.toLocaleString('ru-RU')} {quoteItems[0].unit_snapshot})
                    </strong>
                    {quoteItems.length > 1 && (
                      <span className="badge badge-sky" style={{ marginLeft: 6, fontSize: 10 }}>
                        +{quoteItems.length - 1} поз.
                      </span>
                    )}
                  </span>
                ) : deal.notes ? (
                  <span style={{ color: 'var(--text-secondary)' }} title={deal.notes}>
                    {deal.notes.length > 40 ? deal.notes.slice(0, 40) + '...' : deal.notes}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>КП еще не сформировано</span>
                )}
              </div>
            </div>
          </div>

          {/* Сумма сделки и статус привязки к КП */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Сумма сделки</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                {formatCurrency(amount)}
              </div>
            </div>
            {activeQuote ? (
              <span className="badge badge-emerald" style={{ fontSize: 11, padding: '4px 8px' }} title="Сумма взята из актуальной версии КП">
                <Check size={12} />
                <span>Из {activeQuote.quote_number}</span>
              </span>
            ) : (
              <span className="badge" style={{ fontSize: 11, background: '#F1F5F9', color: 'var(--text-muted)' }}>
                Предварительная
              </span>
            )}
          </div>
        </div>

        {/* Воронка стадий (Pipeline Bar) */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 20, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>Воронка: <strong style={{ color: 'var(--primary)' }}>{currentPipeline?.name}</strong></span>
            <span>Текущий статус: <strong style={{ color: currentStage?.color }}>{currentStage?.name}</strong></span>
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

        {/* Основная сетка: Левая колонка (Состав КП и Заметки) + Правая колонка (Параметры и Задачи) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, alignItems: 'start' }}>
          
          {/* ================= ЛЕВАЯ КОЛОНКА ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ГЛАВНЫЙ БЛОК: СОСТАВ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ (КП) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              
              {/* Шапка карточки КП */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: '#FAFAFA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={17} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                        Состав КП (Коммерческого предложения)
                      </h3>
                      {activeQuote && (
                        <span className="badge badge-sky" style={{ fontSize: 11 }}>
                          {activeQuote.quote_number} (v{activeQuote.version})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Товары, тиражи, спецификация и цены для клиента
                    </div>
                  </div>
                </div>

                {/* Кнопки действий с КП */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activeQuote && (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePreviewPdf(activeQuote)}
                        disabled={downloadingPdf}
                        className="btn btn-secondary btn-sm"
                        title="Открыть предпросмотр официального PDF-бланка"
                        style={{ gap: 5 }}
                      >
                        {downloadingPdf ? <Loader2 size={13} className="spin" /> : <Eye size={13} />}
                        <span>Предпросмотр PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(activeQuote)}
                        disabled={downloadingPdf}
                        className="btn btn-secondary btn-sm"
                        title="Скачать PDF-файл предложения"
                        style={{ gap: 5 }}
                      >
                        <Download size={13} />
                        <span>Скачать</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: 5 }}
                  >
                    <Plus size={13} />
                    <span>{activeQuote ? 'Изменить КП' : 'Создать КП'}</span>
                  </button>
                </div>
              </div>

              {/* Если создано несколько КП по этой сделке — переключатель вкладок */}
              {dealQuotes.length > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  background: '#F1F5F9',
                  borderBottom: '1px solid var(--border-subtle)',
                  overflowX: 'auto'
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginRight: 4 }}>
                    Версии КП:
                  </span>
                  {dealQuotes.map(q => {
                    const isSelected = q.id === (activeQuote?.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelectedQuoteId(q.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? 'var(--primary)' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>{q.quote_number}</span>
                        <span style={{ opacity: 0.85 }}>({formatCurrency(q.current_version?.total_amount || 0)})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Содержимое: когда есть активное КП */}
              {activeQuote && activeVersion ? (
                <div>
                  {/* Подшапка с мета-информацией КП */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    background: '#FFFFFF'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} color="var(--text-muted)" />
                        Создано: <strong style={{ color: 'var(--text-main)' }}>{new Date(activeQuote.created_at).toLocaleDateString('ru-RU')}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Срок действия: <strong style={{ color: 'var(--text-main)' }}>до {new Date(activeQuote.valid_until).toLocaleDateString('ru-RU')}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Статус документа:</span>
                      {getQuoteStatusBadge(activeQuote.status)}
                    </div>
                  </div>

                  {/* Таблица товарных позиций КП */}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Package size={15} color="var(--primary)" />
                      <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                        Позиции заказа ({quoteItems.length})
                      </h4>
                    </div>

                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 12 }}>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Товар / Продукция</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Характеристики</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Тираж</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Цена за ед.</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quoteItems.map((item, idx) => {
                            const chars = Object.entries(item.characteristics_snapshot || {}).filter(([_, v]) => Boolean(v));

                            return (
                              <tr 
                                key={item.id || idx}
                                style={{ 
                                  borderBottom: idx < quoteItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                  background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF'
                                }}
                              >
                                {/* Название и фото */}
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: 'var(--radius-sm)',
                                      background: '#F1F5F9',
                                      border: '1px solid var(--border-subtle)',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      {item.image_url_snapshot ? (
                                        <img 
                                          src={item.image_url_snapshot} 
                                          alt={item.name_snapshot}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <Package size={20} color="var(--text-muted)" />
                                      )}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13.5 }}>
                                        {item.name_snapshot}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <span className="badge" style={{ fontSize: 10.5, background: '#F1F5F9', color: '#475569' }}>
                                          Арт: {item.sku_snapshot}
                                        </span>
                                        {item.is_manual_price && (
                                          <span className="badge badge-amber" style={{ fontSize: 10 }} title={item.manual_price_reason || 'Ручная цена'}>
                                            Ручная цена
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Характеристики */}
                                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {chars.length > 0 ? (
                                      chars.map(([k, v]) => (
                                        <span 
                                          key={k}
                                          style={{
                                            fontSize: 11,
                                            background: '#F1F5F9',
                                            border: '1px solid #E2E8F0',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            color: '#475569',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          <strong>{k}:</strong> {String(v)}
                                        </span>
                                      ))
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>—</span>
                                    )}
                                  </div>
                                </td>

                                {/* Тираж / Количество */}
                                <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 14 }}>
                                    {item.quantity.toLocaleString('ru-RU')}
                                  </span>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: 4, fontSize: 12 }}>
                                    {item.unit_snapshot}
                                  </span>
                                </td>

                                {/* Цена за единицу */}
                                <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                    {formatCurrency(item.base_unit_price)}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                                    за {item.unit_snapshot}
                                  </div>
                                </td>

                                {/* Итого по строке */}
                                <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                                    {formatCurrency(item.item_subtotal)}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Блок дополнительных услуг и доплат (если есть) */}
                    {quoteCharges.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Sparkles size={14} color="var(--amber-warning)" />
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                            Дополнительные услуги и доплаты ({quoteCharges.length})
                          </h4>
                        </div>

                        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                            <tbody>
                              {quoteCharges.map((charge, idx) => (
                                <tr 
                                  key={charge.id || idx}
                                  style={{ 
                                    background: '#FFFDFB',
                                    borderBottom: idx < quoteCharges.length - 1 ? '1px solid var(--border-subtle)' : 'none' 
                                  }}
                                >
                                  <td style={{ padding: '8px 12px' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                      {charge.name_snapshot}
                                    </div>
                                    {charge.reason && (
                                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {charge.reason}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    {charge.quantity} шт × {formatCurrency(charge.unit_price)}
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {formatCurrency(charge.total_charge)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Финансовый итог и коммерческие условия */}
                    <div style={{
                      marginTop: 18,
                      background: '#F8FAFC',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 16,
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr',
                      gap: 16
                    }}>
                      {/* Условия поставки и оплаты */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, borderRight: '1px solid var(--border-subtle)', paddingRight: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Условия коммерческого предложения
                        </div>
                        {activeQuote.payment_terms && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text-secondary)' }}>
                            <CreditCard size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span><strong>Оплата:</strong> {activeQuote.payment_terms}</span>
                          </div>
                        )}
                        {activeQuote.production_terms && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text-secondary)' }}>
                            <Clock size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span><strong>Производство:</strong> {activeQuote.production_terms}</span>
                          </div>
                        )}
                        {activeQuote.delivery_terms && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text-secondary)' }}>
                            <Truck size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span><strong>Доставка:</strong> {activeQuote.delivery_terms}</span>
                          </div>
                        )}
                      </div>

                      {/* Калькуляция суммы */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>Стоимость продукции:</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(activeVersion.subtotal)}</span>
                        </div>

                        {activeVersion.total_surcharges > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Доплаты и услуги:</span>
                            <span style={{ fontWeight: 600 }}>+{formatCurrency(activeVersion.total_surcharges)}</span>
                          </div>
                        )}

                        {activeVersion.total_discount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--emerald-dark)' }}>
                            <span>Скидка:</span>
                            <span style={{ fontWeight: 600 }}>-{formatCurrency(activeVersion.total_discount)}</span>
                          </div>
                        )}

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'baseline',
                          marginTop: 6, 
                          paddingTop: 8, 
                          borderTop: '2px solid var(--border-medium)',
                          fontWeight: 800,
                          fontSize: 16,
                          color: 'var(--text-main)'
                        }}>
                          <span>Итого по КП:</span>
                          <span style={{ color: 'var(--primary)', fontSize: 18 }}>
                            {formatCurrency(activeVersion.total_amount)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--emerald-dark)', marginTop: 2 }}>
                          <CheckCircle2 size={12} color="var(--emerald-success)" />
                          <span>Сумма сделки синхронизирована с КП</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state: когда КП еще не сформировано */
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px'
                  }}>
                    <Package size={26} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                    В сделке пока нет коммерческого предложения (КП)
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 16px' }}>
                    Сформируйте КП, чтобы выбрать товары из каталога, зафиксировать тираж по оптовому прайсу и выставить счет-договор клиенту.
                  </p>

                  {/* Если в заметках сделки есть информация о первичном запросе клиента */}
                  {deal.notes && (
                    <div style={{
                      maxWidth: 480,
                      margin: '0 auto 18px',
                      background: '#FFFDF5',
                      border: '1px solid #FDE68A',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 12.5,
                      color: '#92400E'
                    }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <Tag size={13} />
                        <span>Запрос клиента при обращении:</span>
                      </div>
                      <div>«{deal.notes}»</div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="btn btn-primary"
                    style={{ gap: 6 }}
                  >
                    <Plus size={15} />
                    <span>Рассчитать тираж и создать КП</span>
                  </button>
                </div>
              )}
            </div>

            {/* Карточка: Заметки и переписка */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={15} color="var(--primary)" />
                <span>Заметки и договоренности с клиентом</span>
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Пожелания по цветности логотипа, требования к плотности картона, детали согласования макета
              </p>
              <textarea
                rows={3}
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Клиент просил предоставить образцы стаканов 250 мл и 350 мл..."
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleSave} className="btn btn-secondary btn-sm">
                  <Save size={13} />
                  <span>Сохранить заметку</span>
                </button>
              </div>
            </div>

          </div>


          {/* ================= ПРАВАЯ КОЛОНКА ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Карточка: Параметры сделки */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                Параметры сделки
              </h3>

              <form onSubmit={handleSave}>
                <div style={{ marginBottom: 14 }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
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
                    <label className="label">Стадия / этап</label>
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

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label className="label" style={{ margin: 0 }}>Компания / Клиент *</label>
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

                <div style={{ marginBottom: 14 }}>
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
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''} {c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="label">Сумма сделки (KZT)</label>
                    <input
                      type="number"
                      step={100}
                      className="input"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                      {formatCurrency(amount)}
                    </span>
                  </div>

                  <div>
                    <label className="label">Ожидаемое закрытие</label>
                    <input
                      type="date"
                      className="input"
                      value={expectedCloseDate}
                      onChange={(e) => setExpectedCloseDate(e.target.value)}
                    />
                  </div>
                </div>

                {currentStage?.is_lost && (
                  <div style={{ marginBottom: 14, background: 'var(--rose-light)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rose-border)' }}>
                    <label className="label" style={{ color: 'var(--rose-dark)' }}>
                      Причина проигрыша (ТЗ п. 3.4) *
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={lossReason}
                      onChange={(e) => setLossReason(e.target.value)}
                      placeholder="Например: Дорого, выбрали другого поставщика"
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}>
                  <Save size={15} />
                  <span>Сохранить параметры сделки</span>
                </button>
              </form>
            </div>

            {/* Карточка: Задачи по сделке */}
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
                    placeholder="Новая задача (например: отправить макет)..."
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
