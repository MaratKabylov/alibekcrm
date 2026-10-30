'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { ArrowLeft, User, Plus } from 'lucide-react';

function NewContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('company_id') || '';

  const { addContact, companies } = useCRM();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'whatsapp' | 'phone' | 'email' | 'telegram'>('whatsapp');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      alert('Укажите имя контакта');
      return;
    }
    if (!phone.trim()) {
      alert('Укажите номер телефона');
      return;
    }

    const created = addContact({
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

    router.push(`/contacts/${created.id}`);
  };

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label className="label">Имя *</label>
            <input
              type="text"
              required
              placeholder="Данияр"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Фамилия</label>
            <input
              type="text"
              placeholder="Сериков"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label className="label">Должность / Роль</label>
            <input
              type="text"
              placeholder="Управляющий закупками, шеф-бариста..."
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Компания</label>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label className="label">Телефон *</label>
            <input
              type="text"
              required
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
              placeholder="daniyar@coffee.kz"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="label">Предпочтительный канал связи</label>
          <select
            className="select"
            value={preferredChannel}
            onChange={(e) => setPreferredChannel(e.target.value as any)}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Телефонный звонок</option>
            <option value="email">Электронная почта</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="label">Заметки по контакту</label>
          <textarea
            rows={3}
            className="textarea"
            placeholder="Особые пожелания, график работы..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Link href="/contacts" className="btn btn-secondary">
            Отмена
          </Link>
          <button type="submit" className="btn btn-primary">
            <Plus size={15} />
            <span>Создать контакт</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewContactPage() {
  return (
    <>
      <Header />
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/contacts" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К контактам</span>
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Новый контакт</h1>
          </div>
        </div>

        <Suspense fallback={<div className="card">Загрузка...</div>}>
          <NewContactForm />
        </Suspense>
      </div>
    </>
  );
}

