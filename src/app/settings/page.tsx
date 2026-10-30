'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Settings, Building2, CreditCard, FileText, CheckCircle2, Palette, Sun, Moon, Shield, User, LogOut, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { settings } = useCRM();
  const { profile, user, signOut, isConfigured, resetPassword } = useAuth();

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
  const [resetSent, setResetSent] = useState(false);

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

  const handlePasswordReset = async () => {
    const targetEmail = profile?.email || user?.email;
    if (targetEmail) {
      await resetPassword(targetEmail);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Алибек М.';
  const displayEmail = profile?.email || user?.email || 'admin@alibekcrm.kz';
  const displayRole = profile?.role === 'admin' ? 'Администратор' : 'Менеджер';

  return (
    <>
      <Header />

      <div className="page-wrapper" style={{ maxWidth: 840 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Настройки CRM и профиля</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Управление учетной записью, оформление интерфейса и реквизиты компании для КП
          </p>
        </div>

        {/* Секция: Текущий пользователь и безопасность (Supabase Auth) */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Учетная запись и безопасность (Supabase Auth)</h3>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: isConfigured ? '#ECFDF5' : '#FEF3C7',
              color: isConfigured ? '#047857' : '#B45309'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isConfigured ? '#10B981' : '#F59E0B' }} />
              {isConfigured ? 'Supabase Auth подключен' : 'Демо-режим'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            background: 'var(--bg-subtle, #F8FAFC)',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16
              }}>
                <User size={22} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {displayEmail} &bull; <strong style={{ color: 'var(--primary)' }}>{displayRole}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
              >
                <KeyRound size={14} />
                <span>Сбросить пароль</span>
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6, color: 'var(--danger, #DC2626)' }}
              >
                <LogOut size={14} />
                <span>Выйти</span>
              </button>
            </div>
          </div>

          {resetSent && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: '#ECFDF5',
              color: '#047857',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={15} />
              <span>Ссылка для смены пароля отправлена на почту {displayEmail}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>
          {/* Секция выбора темы оформления EspoCRM */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Palette size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Тема интерфейса меню (EspoCRM Style)</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Выберите между классическим темным боковым меню или современным светлым стилем
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div
                onClick={() => handleThemeChange('classic')}
                style={{
                  border: `2px solid ${sidebarTheme === 'classic' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  borderRadius: 10,
                  padding: 14,
                  cursor: 'pointer',
                  background: sidebarTheme === 'classic' ? '#EFF6FF' : '#FFFFFF',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Moon size={16} color="var(--primary)" />
                  <strong style={{ fontSize: 13 }}>EspoCRM Classic (Тёмное меню)</strong>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Тёмно-синий сайдбар (#1E293B) с контрастными белыми акцентами в эталонном стиле CRM.
                </p>
              </div>

              <div
                onClick={() => handleThemeChange('light')}
                style={{
                  border: `2px solid ${sidebarTheme === 'light' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  borderRadius: 10,
                  padding: 14,
                  cursor: 'pointer',
                  background: sidebarTheme === 'light' ? '#EFF6FF' : '#FFFFFF',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sun size={16} color="var(--primary)" />
                  <strong style={{ fontSize: 13 }}>EspoCRM Light (Светлое меню)</strong>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Светлый сайдбар (#FFFFFF) с мягкой разделительной линией для спокойного минималистичного вида.
                </p>
              </div>
            </div>
          </div>

          {/* Реквизиты компании */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Building2 size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Реквизиты поставщика (для бланка КП)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">Торговое название</label>
                <input
                  type="text"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Юридическое наименование (ТОО/ИП)</label>
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
                <label className="label">БИН / ИИН (12 цифр)</label>
                <input
                  type="text"
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
              <h3 style={{ fontSize: 15, margin: 0 }}>Параметры коммерческих предложений</h3>
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
              <span style={{ color: 'var(--emerald-dark, #059669)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
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
