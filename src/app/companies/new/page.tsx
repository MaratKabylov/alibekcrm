'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { ArrowLeft, Building2, Plus, Trash2 } from 'lucide-react';

export default function NewCompanyPage() {
  const router = useRouter();
  const { addCompany } = useCRM();

  const [name, setName] = useState('');
  const [clientType, setClientType] = useState('кофейня');
  const [binIin, setBinIin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');

  const handleAddAddress = () => {
    setAddresses(prev => [...prev, '']);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (index: number, val: string) => {
    setAddresses(prev => prev.map((a, i) => i === index ? val : a));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Укажите название компании');
      return;
    }

    const filteredAddresses = addresses.filter(a => a.trim().length > 0);

    const created = addCompany({
      name: name.trim(),
      client_type: clientType,
      bin_iin: binIin || null,
      phone,
      email,
      website,
      delivery_addresses: filteredAddresses,
      notes,
    });

    router.push(`/companies/${created.id}`);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/companies" className="btn btn-secondary btn-sm">
              <ArrowLeft size={15} />
              <span>К компаниям</span>
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Новая компания / Клиент</h1>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 760 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Название компании / Кофейни *</label>
                <input
                  type="text"
                  required
                  placeholder="Urban Brew"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">БИН / ИИН</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="12 цифр для выставления счетов"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  placeholder="order@client.kz"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Сайт или соцсеть</label>
                <input
                  type="text"
                  placeholder="https://... или @instagram"
                  className="input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            {/* Адреса доставки */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Адрес точки или склада</label>
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
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label">Заметки по клиенту</label>
              <textarea
                rows={3}
                className="textarea"
                placeholder="Специальные условия, график отгрузок..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Link href="/companies" className="btn btn-secondary">
                Отмена
              </Link>
              <button type="submit" className="btn btn-primary">
                <Plus size={15} />
                <span>Создать компанию</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

