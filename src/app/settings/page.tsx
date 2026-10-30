'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { Settings, Building2, CreditCard, FileText, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { settings } = useCRM();

  const [companyName, setCompanyName] = useState(settings.company_name);
  const [legalName, setLegalName] = useState(settings.legal_name || '');
  const [binIin, setBinIin] = useState(settings.bin_iin || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [bankDetails, setBankDetails] = useState(settings.bank_details || '');
  const [validityDays, setValidityDays] = useState(settings.default_quote_validity_days);

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper" style={{ maxWidth: 840 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Настройки CRM и реквизиты КП</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
            Юридические данные компании для формирования коммерческих предложений и договоров
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Building2 size={20} color="#F59E0B" />
              <h3 style={{ fontSize: 16 }}>Реквизиты продавца (для бланков КП)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Торговое наименование</label>
                <input
                  type="text"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Юридическое наименование</label>
                <input
                  type="text"
                  className="input"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">БИН / ИИН</label>
                <input
                  type="text"
                  maxLength={12}
                  className="input"
                  value={binIin}
                  onChange={(e) => setBinIin(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Телефон для клиентов</label>
                <input
                  type="text"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Фактический адрес и склад</label>
              <input
                type="text"
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Email отдела продаж</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Банковские реквизиты (счет, банк, БИК)</label>
              <textarea
                rows={2}
                className="textarea"
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <FileText size={20} color="#F59E0B" />
              <h3 style={{ fontSize: 16 }}>Параметры коммерческих предложений</h3>
            </div>

            <div style={{ maxWidth: 300 }}>
              <label className="label">Срок действия КП по умолчанию (в днях)</label>
              <input
                type="number"
                min={1}
                max={90}
                className="input"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value) || 14)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
            {saved && (
              <span style={{ color: '#10B981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Настройки успешно сохранены
              </span>
            )}
            <button type="submit" className="btn btn-primary">
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
