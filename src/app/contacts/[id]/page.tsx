'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { formatCurrency } from '@/lib/calculator';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  Plus, 
  Save, 
  Check, 
  AlertCircle,
  ExternalLink,
  Kanban,
  Clock
} from 'lucide-react';

function ContactDetailContent() {
  const params = useParams();
  const router = useRouter();
  const contactId = params?.id as string;

  const { contacts, companies, deals, stages, tasks, updateContact, addTask, toggleTaskStatus } = useCRM();

  const contact = contacts.find(c => c.id === contactId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'whatsapp' | 'phone' | 'email' | 'telegram'>('whatsapp');
  const [notes, setNotes] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskType, setNewTaskType] = useState<'call' | 'message' | 'meeting' | 'other'>('call');

  useEffect(() => {
    if (contact) {
      setFirstName(contact.first_name || '');
      setLastName(contact.last_name || '');
      setPosition(contact.position || '');
      setCompanyId(contact.company_id || '');
      setPhone(contact.phone || '');
      setEmail(contact.email || '');
      setPreferredChannel(contact.preferred_channel || 'whatsapp');
      setNotes(contact.notes || '');
    }
  }, [contact]);

  if (!contact) {
    return (
      <>
        <Header />
        <div className="page-wrapper">
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={44} color="var(--rose-danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Контакт не найден</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Возможно, контакт был удален или перемещен.
            </p>
            <Link href="/contacts" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Вернуться к контактам</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const selectedCompany = companies.find(c => c.id === companyId);
  const contactDeals = deals.filter(d => d.contact_id === contact.id);
  const contactTasks = tasks.filter(t => t.contact_id === contact.id);
  const normalizedPhone = contact.phone_normalized || phone.replace(/\D/g, '');

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim()) {
      alert('Укажите имя контакта');
      return;
    }

    updateContact(contact.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      position: position.trim() || null,
      company_id: companyId || null,
      phone: phone.trim(),
      phone_normalized: phone.replace(/\D/g, ''),
      email: email.trim() || null,
      preferred_channel: preferredChannel,
      notes,
    });

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      task_type: newTaskType,
      due_date: newTaskDueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      contact_id: contact.id,
      company_id: companyId || undefined,
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/contacts" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К контактам</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: 15
              }}>
                {firstName[0] || 'К'}
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                  {firstName} {lastName}
                </h1>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {position || 'Представитель'} {selectedCompany ? `• ${selectedCompany.name}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {savedNotification && (
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px' }}>
                <Check size={14} />
                <span>Сохранено</span>
              </span>
            )}
            <a
              href={`https://wa.me/${normalizedPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success"
              style={{ gap: 6 }}
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              <Save size={15} />
              <span>Сохранить</span>
            </button>
          </div>
        </div>

        {/* Сетка: Данные контакта слева + Сделки и задачи справа */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Левая колонка */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
              Персональные данные и связь
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Имя *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Фамилия</label>
                  <input
                    type="text"
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Должность / Роль</label>
                  <input
                    type="text"
                    placeholder="Управляющий, бариста, ЛПР..."
                    className="input"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label className="label" style={{ margin: 0 }}>Компания</label>
                    {companyId && (
                      <Link 
                        href={`/companies/${companyId}`} 
                        style={{ fontSize: 11, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                      >
                        <span>В компанию</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                  <select
                    className="select"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                  >
                    <option value="">Без компании</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Телефон *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Предпочтительный канал связи (ТЗ п. 3.2)</label>
                <select
                  className="select"
                  value={preferredChannel}
                  onChange={(e) => setPreferredChannel(e.target.value as any)}
                >
                  <option value="whatsapp">WhatsApp (основной канал)</option>
                  <option value="phone">Телефонный звонок</option>
                  <option value="email">Электронная почта</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Заметки и особенности общения</label>
                <textarea
                  rows={4}
                  className="textarea"
                  placeholder="В какое время удобнее связываться, в каком филиале работает..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} />
                  <span>Сохранить контакт</span>
                </button>
              </div>
            </form>
          </div>

          {/* Правая колонка: Сделки и задачи */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Сделки с контактом */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Kanban size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Сделки с контактом</h3>
                </div>
                <Link
                  href={`/deals/new?company_id=${companyId || ''}&contact_id=${contact.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                >
                  <Plus size={13} />
                  <span>Создать сделку</span>
                </Link>
              </div>

              {contactDeals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contactDeals.map(d => {
                    const st = stages.find(s => s.id === d.stage_id);
                    return (
                      <Link
                        key={d.id}
                        href={`/deals/${d.id}`}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          background: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>
                            {d.title}
                          </div>
                          {st && (
                            <span 
                              className="badge" 
                              style={{ 
                                background: `${st.color}15`, 
                                color: st.color, 
                                fontSize: 10.5,
                                marginTop: 3 
                              }}
                            >
                              {st.name}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>
                            {formatCurrency(d.amount)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 10px', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  Пока нет сделок, привязанных к этому контакту
                </div>
              )}
            </div>

            {/* Задачи по контакту */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Задачи и напоминания</h3>
                </div>
                <span className="badge" style={{ background: '#F1F5F9' }}>
                  {contactTasks.filter(t => t.status === 'pending').length} в работе
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {contactTasks.map(task => (
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

                {contactTasks.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    Нет запланированных задач
                  </div>
                )}
              </div>

              {/* Форма добавления задачи */}
              <form onSubmit={handleAddTask} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    required
                    placeholder="Например: Перезвонить по поводу образцов..."
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

export default function ContactDetailPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="page-wrapper"><div className="card">Загрузка контакта...</div></div>
      </>
    }>
      <ContactDetailContent />
    </Suspense>
  );
}
