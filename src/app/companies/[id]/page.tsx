'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { formatCurrency } from '@/lib/calculator';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle,
  ExternalLink,
  Kanban
} from 'lucide-react';

function CompanyDetailContent() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const { companies, contacts, deals, stages, updateCompany } = useCRM();

  const company = companies.find(c => c.id === companyId);

  const [name, setName] = useState('');
  const [clientType, setClientType] = useState('кофейня');
  const [binIin, setBinIin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setClientType(company.client_type || 'кофейня');
      setBinIin(company.bin_iin || '');
      setPhone(company.phone || '');
      setEmail(company.email || '');
      setWebsite(company.website || '');
      setAddresses(company.delivery_addresses && company.delivery_addresses.length > 0 ? company.delivery_addresses : ['']);
      setNotes(company.notes || '');
    }
  }, [company]);

  if (!company) {
    return (
      <>
        <Header />
        <div className="page-wrapper">
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={44} color="var(--rose-danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Компания не найдена</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Возможно, компания была удалена или перенесена в архив.
            </p>
            <Link href="/companies" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Вернуться к списку компаний</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const companyContacts = contacts.filter(c => c.company_id === company.id);
  const companyDeals = deals.filter(d => d.company_id === company.id);

  const handleAddAddress = () => {
    setAddresses(prev => [...prev, '']);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (index: number, val: string) => {
    setAddresses(prev => prev.map((a, i) => i === index ? val : a));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert('Укажите название компании');
      return;
    }

    const filteredAddresses = addresses.filter(a => a.trim().length > 0);

    updateCompany(company.id, {
      name: name.trim(),
      client_type: clientType,
      bin_iin: binIin || null,
      phone,
      email,
      website,
      delivery_addresses: filteredAddresses,
      notes,
    });

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Заголовок и навигация */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/companies" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К компаниям</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={20} color="var(--primary)" />
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{name || company.name}</h1>
              <span className="badge badge-sky" style={{ textTransform: 'capitalize' }}>
                {clientType}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {savedNotification && (
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px' }}>
                <Check size={14} />
                <span>Сохранено</span>
              </span>
            )}
            <Link href={`/deals/new?company_id=${company.id}`} className="btn btn-secondary">
              <Plus size={15} />
              <span>Новая сделка</span>
            </Link>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              <Save size={15} />
              <span>Сохранить</span>
            </button>
          </div>
        </div>

        {/* Сетка: Форма слева + Контакты и сделки справа */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Левая колонка */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
              Реквизиты и данные клиента
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Название компании / Кофейни *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Тип клиента</label>
                  <select
                    className="select"
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value)}
                  >
                    <option value="кофейня">Кофейня</option>
                    <option value="сеть кофеен">Сеть кофеен</option>
                    <option value="пиццерия">Пиццерия</option>
                    <option value="пекарня">Пекарня</option>
                    <option value="фастфуд">Фастфуд</option>
                    <option value="другое">Другое</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">БИН / ИИН</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12 цифр"
                    className="input"
                    value={binIin}
                    onChange={(e) => setBinIin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Общий телефон</label>
                  <input
                    type="text"
                    placeholder="+7 (701) 000-00-00"
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="label">Email компании</label>
                  <input
                    type="email"
                    placeholder="order@coffee.kz"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Сайт или Instagram</label>
                  <input
                    type="text"
                    placeholder="https://... или @coffee"
                    className="input"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              {/* Адреса доставки / складов */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="label" style={{ margin: 0 }}>Адреса точек и доставки</label>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    <Plus size={12} />
                    <span>Добавить адрес</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {addresses.map((addr, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="г. Алматы, пр. Абая 150/1"
                        className="input"
                        value={addr}
                        onChange={(e) => handleAddressChange(idx, e.target.value)}
                      />
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAddress(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--rose-danger)',
                            cursor: 'pointer',
                            padding: 6
                          }}
                          title="Удалить адрес"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Заметки и особенности клиента</label>
                <textarea
                  rows={3}
                  className="textarea"
                  placeholder="График приемки поставок, ответственные лица, особенности разгрузки..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} />
                  <span>Сохранить компанию</span>
                </button>
              </div>
            </form>
          </div>

          {/* Правая колонка: Контакты и Сделки */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Контакты компании */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Представители и контакты</h3>
                </div>
                <Link
                  href={`/contacts/new?company_id=${company.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                >
                  <Plus size={13} />
                  <span>Добавить</span>
                </Link>
              </div>

              {companyContacts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {companyContacts.map(c => (
                    <Link
                      key={c.id}
                      href={`/contacts/${c.id}`}
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
                          {c.first_name} {c.last_name || ''}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {c.position || 'Представитель'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                          {c.phone}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 10px', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  К этой компании еще не привязаны контакты
                </div>
              )}
            </div>

            {/* Сделки компании */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Kanban size={17} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Сделки компании</h3>
                </div>
                <Link
                  href={`/deals/new?company_id=${company.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                >
                  <Plus size={13} />
                  <span>Создать сделку</span>
                </Link>
              </div>

              {companyDeals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {companyDeals.map(d => {
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
                  Пока нет сделок с этой компанией
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CompanyDetailPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="page-wrapper"><div className="card">Загрузка карточки компании...</div></div>
      </>
    }>
      <CompanyDetailContent />
    </Suspense>
  );
}
