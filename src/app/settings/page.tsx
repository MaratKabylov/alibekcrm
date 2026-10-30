'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { Settings, Building2, CreditCard, FileText, CheckCircle2, Palette, Sun, Moon } from 'lucide-react';

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
  const [sidebarTheme, setSidebarTheme] = useState<'classic' | 'light'>('classic');

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('alibek_crm_sidebar_theme') as 'classic' | 'light' | null;
    if (savedTheme) {
      setSidebarTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (theme: 'classic' | 'light') => {
    setSidebarTheme(theme);
    localStorage.setItem('alibek_crm_sidebar_theme', theme);
    if (theme === 'light') {
      document.documentElement.setAttribute('data-sidebar-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-sidebar-theme');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper" style={{ maxWidth: 840 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Настройки CRM и реквизиты КП</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Оформление интерфейса и юридические данные компании для формирования КП
          </p>
        </div>

        <form onSubmit={handleSave}>
          {/* Секция выбора темы оформления EspoCRM */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Palette size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15 }}>Оформление интерфейса (стиль EspoCRM)</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Чистый светлый корпоративный стиль без излишеств, высокая контрастность и читаемость данных.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div
                onClick={() => handleThemeChange('classic')}
                style={{
                  border: sidebarTheme === 'classic' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: sidebarTheme === 'classic' ? 'var(--primary-light)' : '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Moon size={16} color="var(--primary)" />
                  <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>EspoCRM Классик</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Тёмно-синий сайдбар (#283344) + чистая светлая рабочая область. Классический вид EspoCRM по умолчанию.
                </div>
              </div>

              <div
                onClick={() => handleThemeChange('light')}
                style={{
                  border: sidebarTheme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: sidebarTheme === 'light' ? 'var(--primary-light)' : '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sun size={16} color="var(--primary)" />
                  <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>EspoCRM Светлый</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Полностью светлый интерфейс: белый сайдбар (#FFFFFF) и светлая рабочая область.
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Building2 size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15 }}>Реквизиты продавца (для бланков КП)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

            <div style={{ marginBottom: 14 }}>
              <label className="label">Фактический адрес и склад</label>
              <input
                type="text"
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
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

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <FileText size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15 }}>Параметры коммерческих предложений</h3>
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
              <span style={{ color: 'var(--emerald-dark)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
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
