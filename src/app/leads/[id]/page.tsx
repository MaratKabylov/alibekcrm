'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { LeadStatus } from '@/types/database';
import { 
  ArrowLeft, 
  Users2, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  Save, 
  Check, 
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Kanban,
  Clock,
  CheckCircle2
} from 'lucide-react';

function LeadDetailContent() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const { leads, companies, contacts, tasks, updateLead, convertLead, addTask, toggleTaskStatus } = useCRM();

  const lead = leads.find(l => l.id === leadId);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interestedProducts, setInterestedProducts] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [junkReason, setJunkReason] = useState('');
  const [notes, setNotes] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  // Конвертация
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState('');

  // Задачи
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskType, setNewTaskType] = useState<'call' | 'message' | 'meeting' | 'other'>('call');

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setCompanyName(lead.company_name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setInterestedProducts(lead.interested_products || '');
      setStatus(lead.status || 'new');
      setJunkReason(lead.junk_reason || '');
      setNotes(lead.notes || '');
      setDealTitle(`Поставка: ${lead.company_name || lead.name}`);
    }
  }, [lead]);

  if (!lead) {
    return (
      <>
        <Header />
        <div className="page-wrapper">
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={44} color="var(--rose-danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Лид не найден</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Возможно, лид был удален или сконвертирован.
            </p>
            <Link href="/leads" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Вернуться к лидам</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Проверка дублей по телефону по ТЗ п. 3.3
  const normalizedPhone = phone.replace(/\D/g, '');
  const duplicateContact = normalizedPhone.length >= 7 
    ? contacts.find(c => c.phone_normalized.includes(normalizedPhone) || normalizedPhone.includes(c.phone_normalized))
    : null;

  const leadTasks = tasks.filter(t => t.lead_id === lead.id);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert('Укажите имя или название лида');
      return;
    }

    updateLead(lead.id, {
      name: name.trim(),
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      phone_normalized: normalizedPhone || null,
      email: email.trim() || null,
      interested_products: interestedProducts.trim() || null,
      notes,
      status,
      junk_reason: status === 'junk' ? junkReason : null,
    });

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleConvert = () => {
    try {
      const res = convertLead(lead.id, {
        createDeal,
        dealTitle: dealTitle || `Поставка: ${lead.company_name || lead.name}`,
        existingCompanyId: selectedCompanyId || undefined,
      });

      alert('Лид успешно сконвертирован в компанию, контакт и сделку!');
      if (res.dealId) {
        router.push(`/deals/${res.dealId}`);
      } else if (res.companyId) {
        router.push(`/companies/${res.companyId}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка конвертации';
      alert(errorMessage);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      task_type: newTaskType,
      due_date: newTaskDueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      lead_id: lead.id,
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  const getStatusBadge = (st: LeadStatus) => {
    switch (st) {
      case 'new':
        return <span className="badge badge-sky">Новый</span>;
      case 'in_progress':
        return <span className="badge badge-amber">В работе</span>;
      case 'qualified':
        return <span className="badge badge-emerald">Квалифицирован</span>;
      case 'junk':
        return <span className="badge badge-rose">Нецелевой</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/leads" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К лидам</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>
                {name || lead.name}
              </h1>
              {getStatusBadge(status)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {savedNotification && (
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px' }}>
                <Check size={14} />
                <span>Сохранено</span>
              </span>
            )}
            <button type="button" onClick={handleSave} className="btn btn-primary">
              <Save size={15} />
              <span>Сохранить</span>
            </button>
          </div>
        </div>

        {/* Сетка: Данные лида слева + Конвертация и задачи справа */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Левая колонка */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
              Информация о лиде
            </h3>

            {/* Предупреждение о дубликате (ТЗ п. 3.3) */}
            {duplicateContact && (
              <div style={{
                background: 'var(--amber-light)',
                border: '1px solid var(--amber-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertTriangle size={18} color="var(--amber-dark)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: 'var(--amber-dark)' }}>
                  <strong>Найден дубликат в контактах:</strong> {duplicateContact.first_name} {duplicateContact.last_name || ''} ({duplicateContact.phone})
                </div>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Имя представителя / ЛПР *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Компания / Кофейня</label>
                  <input
                    type="text"
                    placeholder="Название кофейни"
                    className="input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Телефон</label>
                  <input
                    type="text"
                    placeholder="+7 (701) 000-00-00"
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    placeholder="manager@cafe.kz"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Интересующая продукция / тиражи</label>
                <input
                  type="text"
                  placeholder="Стаканы 350 мл, крышки D90, брендирование в 2 цвета..."
                  className="input"
                  value={interestedProducts}
                  onChange={(e) => setInterestedProducts(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Статус обработки лида</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                >
                  <option value="new">Новый</option>
                  <option value="in_progress">В работе</option>
                  <option value="qualified">Квалифицирован</option>
                  <option value="junk">Нецелевой / Брак</option>
                </select>
              </div>

              {status === 'junk' && (
                <div style={{ marginBottom: 16, background: 'var(--rose-light)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rose-border)' }}>
                  <label className="label" style={{ color: 'var(--rose-dark)' }}>
                    Причина нецелевого обращения (ТЗ п. 3.3) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Не подходят тиражи, физлицо, спам, ошиблись номером..."
                    className="input"
                    value={junkReason}
                    onChange={(e) => setJunkReason(e.target.value)}
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label className="label">Заметки и комментарии</label>
                <textarea
                  rows={4}
                  className="textarea"
                  placeholder="Детали первого разговора, пожелания по срокам..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} />
                  <span>Сохранить лид</span>
                </button>
              </div>
            </form>
          </div>

          {/* Правая колонка: Конвертация и задачи */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Блок конвертации (ТЗ п. 3.3) */}
            <div className="card" style={{ border: lead.converted_at ? '1px solid var(--emerald-border)' : '1px solid var(--primary-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ArrowRight size={18} color={lead.converted_at ? 'var(--emerald-success)' : 'var(--primary)'} />
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                  {lead.converted_at ? 'Лид успешно сконвертирован' : 'Конвертация в клиента и сделку'}
                </h3>
              </div>

              {lead.converted_at ? (
                <div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    Этот лид был квалифицирован и переведен в рабочую базу CRM.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lead.converted_company_id && (
                      <Link
                        href={`/companies/${lead.converted_company_id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'space-between' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={13} color="var(--primary)" />
                          <span>Перейти в компанию</span>
                        </span>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    {lead.converted_contact_id && (
                      <Link
                        href={`/contacts/${lead.converted_contact_id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'space-between' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} color="var(--primary)" />
                          <span>Перейти в контакт</span>
                        </span>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    {lead.converted_deal_id && (
                      <Link
                        href={`/deals/${lead.converted_deal_id}`}
                        className="btn btn-primary btn-sm"
                        style={{ justifyContent: 'space-between' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Kanban size={13} />
                          <span>Перейти в сделку</span>
                        </span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    Конвертация создаст контакт и компанию в базе клиентов, а также откроет сделку в воронке.
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    <label className="label">Привязать к существующей компании?</label>
                    <select
                      className="select"
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                    >
                      <option value="">Создать новую: «{companyName || name}»</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>Существующая: {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={createDeal}
                        onChange={(e) => setCreateDeal(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>Создать сделку в воронке продаж</span>
                    </label>
                  </div>

                  {createDeal && (
                    <div style={{ marginBottom: 16 }}>
                      <label className="label">Название сделки</label>
                      <input
                        type="text"
                        className="input"
                        value={dealTitle}
                        onChange={(e) => setDealTitle(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConvert}
                    className="btn btn-primary"
                    style={{ width: '100%', gap: 8, padding: '10px 16px' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Сконвертировать в сделку и клиента</span>
                  </button>
                </div>
              )}
            </div>

            {/* Задачи по лиду */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Задачи по лиду</h3>
                </div>
                <span className="badge" style={{ background: '#F1F5F9' }}>
                  {leadTasks.filter(t => t.status === 'pending').length} в работе
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {leadTasks.map(task => (
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

                {leadTasks.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    Нет запланированных задач по лиду
                  </div>
                )}
              </div>

              {/* Форма добавления задачи */}
              <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    required
                    placeholder="Например: Квалифицировать запрос по тиражу..."
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
    </>
  );
}

export default function LeadDetailPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="page-wrapper"><div className="card">Загрузка лида...</div></div>
      </>
    }>
      <LeadDetailContent />
    </Suspense>
  );
}
