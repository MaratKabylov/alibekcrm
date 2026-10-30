'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Company } from '@/types/database';
import { X, Building2, MapPin, Plus, Trash2 } from 'lucide-react';

interface CompanyModalProps {
  company?: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyModal({ company, isOpen, onClose }: CompanyModalProps) {
  const { addCompany, updateCompany } = useCRM();

  const [name, setName] = useState(company?.name || '');
  const [clientType, setClientType] = useState(company?.client_type || 'кофейня');
  const [binIin, setBinIin] = useState(company?.bin_iin || '');
  const [phone, setPhone] = useState(company?.phone || '');
  const [email, setEmail] = useState(company?.email || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [addresses, setAddresses] = useState<string[]>(company?.delivery_addresses || ['']);
  const [notes, setNotes] = useState(company?.notes || '');

  if (!isOpen) return null;

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

    if (company) {
      updateCompany(company.id, {
        name,
        client_type: clientType,
        bin_iin: binIin || null,
        phone,
        email,
        website,
        delivery_addresses: filteredAddresses,
        notes,
      });
    } else {
      addCompany({
        name,
        client_type: clientType,
        bin_iin: binIin || null,
        phone,
        email,
        website,
        delivery_addresses: filteredAddresses,
        notes,
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 17, color: 'var(--text-main)' }}>
            {company ? 'Карточка компании' : 'Новая компания'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
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
                <option value="пекарня">Пекарня / Кондитерская</option>
                <option value="дистрибьютор">Дистрибьютор</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">БИН / ИИН (Казахстан)</label>
              <input
                type="text"
                maxLength={12}
                placeholder="12 цифр"
                className="input"
                value={binIin}
                onChange={(e) => setBinIin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div>
              <label className="label">Основной телефон</label>
              <input
                type="text"
                placeholder="+7 (777) 123-45-67"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                placeholder="order@company.kz"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Сайт</label>
              <input
                type="text"
                placeholder="company.kz"
                className="input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {/* Адреса доставки (п. 3.1 ТЗ) */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="label">Адреса доставки / точки кофеен</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddAddress}
                style={{ padding: '2px 8px', fontSize: 11 }}
              >
                <Plus size={12} /> Добавить адрес
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {addresses.map((addr, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <input
                    type="text"
                    placeholder={`Адрес доставки ${idx + 1}`}
                    className="input"
                    value={addr}
                    onChange={(e) => handleAddressChange(idx, e.target.value)}
                  />
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAddress(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--rose-danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Заметки / Комментарии</label>
            <textarea
              rows={2}
              className="textarea"
              placeholder="Объемы закупки, специфика кофеен..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              {company ? 'Сохранить' : 'Создать компанию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
