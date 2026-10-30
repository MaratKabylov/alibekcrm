'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Coffee, Lock, Mail, User, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/database';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const urlError = searchParams.get('error');

  const { signInWithPassword, signUp, resetPassword, signInAsDemo, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'auth_callback_failed' ? 'Ошибка подтверждения сессии. Попробуйте войти повторно.' : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signInWithPassword(email, password);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMessage('Укажите ФИО сотрудника');
          setLoading(false);
          return;
        }

        const result = await signUp(email, password, fullName, role);
        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.requiresEmailConfirmation) {
          setSuccessMessage('Ссылка для подтверждения регистрации отправлена на указанный email. Проверьте почту.');
          setMode('signin');
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage('Инструкция по сбросу пароля отправлена на ваш email.');
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (selectedRole: UserRole) => {
    signInAsDemo(selectedRole);
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      padding: 24,
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Шапка формы с брендингом */}
        <div style={{
          padding: '32px 32px 24px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            marginBottom: 12
          }}>
            <Coffee size={26} strokeWidth={2.3} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
            Alibek CRM
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Управление клиентами, тиражными ценами и КП
          </p>

          {/* Индикатор статуса Supabase */}
          <div style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: isConfigured ? '#ECFDF5' : '#FEF3C7',
            color: isConfigured ? '#047857' : '#B45309',
            border: `1px solid ${isConfigured ? '#A7F3D0' : '#FDE68A'}`
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isConfigured ? '#10B981' : '#F59E0B'
            }} />
            <span>{isConfigured ? 'Supabase Auth активен' : 'Демо-режим (Supabase не настроен)'}</span>
          </div>
        </div>

        {/* Переключатель вкладок Вход / Регистрация */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: '#F1F5F9'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: mode === 'signin' ? '#FFFFFF' : 'transparent',
              fontWeight: mode === 'signin' ? 700 : 500,
              color: mode === 'signin' ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: mode === 'signin' ? '2px solid var(--primary)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Вход в систему
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: mode === 'signup' ? '#FFFFFF' : 'transparent',
              fontWeight: mode === 'signup' ? 700 : 500,
              color: mode === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: mode === 'signup' ? '2px solid var(--primary)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Регистрация
          </button>
        </div>

        <div style={{ padding: 32 }}>
          {/* Сообщения об ошибках / успехе */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              fontSize: 13,
              marginBottom: 20
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#047857',
              fontSize: 13,
              marginBottom: 20
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Поле ФИО (только при регистрации) */}
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                  ФИО сотрудника
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Алибек Маратов"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 38, width: '100%', height: 40 }}
                  />
                </div>
              </div>
            )}

            {/* Роль в системе (только при регистрации) */}
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                  Роль сотрудника
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    border: `1px solid ${role === 'manager' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    background: role === 'manager' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    <input
                      type="radio"
                      name="role"
                      value="manager"
                      checked={role === 'manager'}
                      onChange={() => setRole('manager')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>Менеджер</span>
                  </label>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    border: `1px solid ${role === 'admin' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    background: role === 'admin' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>Администратор</span>
                  </label>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                Рабочий email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="alibek@crm.kz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38, width: '100%', height: 40 }}
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                    Пароль
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 38, paddingRight: 38, width: '100%', height: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Кнопка отправки формы */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: 42,
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                marginTop: 6
              }}
            >
              {loading ? (
                <span>Выполняется...</span>
              ) : mode === 'signin' ? (
                <>
                  <span>Войти в CRM</span>
                  <ArrowRight size={16} />
                </>
              ) : mode === 'signup' ? (
                <>
                  <ShieldCheck size={16} />
                  <span>Зарегистрироваться</span>
                </>
              ) : (
                <span>Отправить ссылку для сброса</span>
              )}
            </button>
          </form>

          {/* Быстрый демо-вход для тестирования без базы данных */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, fontWeight: 500 }}>
              Быстрый вход для тестирования:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, justifyContent: 'center' }}
                title="Войти как Алибек М. (Администратор)"
              >
                Администратор
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('manager')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, justifyContent: 'center' }}
                title="Войти как Данияр К. (Менеджер)"
              >
                Менеджер
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#FFFFFF' }}>
        Загрузка страницы входа...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

