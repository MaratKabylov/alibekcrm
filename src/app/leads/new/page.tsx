'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { LeadStatus } from '@/types/database';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';

export default function NewLeadPage() {
  const router = useRouter();
  const { addLead, contacts } = useCRM();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interestedProducts, setInterestedProducts] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [junkReason, setJunkReason] = useState('');
  const [notes, setNotes] = useState('');

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

    const created = addLead({
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

    router.push(`/leads/${created.id}`);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/leads" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К списку лидов</span>
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Новый лид / Обращение</h1>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 760 }}>
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
                <strong>Внимание!</strong> Номер уже зарегистрирован за контактом: {duplicateContact.first_name} {duplicateContact.last_name || ''} ({duplicateContact.phone})
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Имя представителя / Контактное лицо *</label>
                <input
                  type="text"
                  required
                  placeholder="Айдос"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Компания / Кофейня (если известно)</label>
                <input
                  type="text"
                  placeholder="Кофейня «Аромат»"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
                  placeholder="lead@cafe.kz"
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
                placeholder="Однослойные стаканы 350 мл (5 000 шт), крышки D90..."
                className="input"
                value={interestedProducts}
                onChange={(e) => setInterestedProducts(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
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
              <div style={{ marginBottom: 16, background: 'var(--rose-light)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rose-border)' }}>
                <label className="label" style={{ color: 'var(--rose-dark)' }}>
                  Причина нецелевого обращения *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Не подошли минимальные тиражи, физлицо..."
                  className="input"
                  value={junkReason}
                  onChange={(e) => setJunkReason(e.target.value)}
                />
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label className="label">Заметки и комментарии</label>
              <textarea
                rows={3}
                className="textarea"
                placeholder="Откуда пришел лид, срочность, контекст..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Link href="/leads" className="btn btn-secondary">
                Отмена
              </Link>
              <button type="submit" className="btn btn-primary">
                <Plus size={15} />
                <span>Создать лид</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

