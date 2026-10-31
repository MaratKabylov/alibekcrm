'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Coffee, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound,
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const urlError = searchParams.get('error');
  const urlMode = searchParams.get('mode');

  const { signInWithPassword, resetPassword, updatePassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'forgot' | 'update-password'>(
    urlMode === 'update-password' ? 'update-password' : 'signin'
  );
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'auth_callback_failed' ? 'Ошибка подтверждения сессии. Попробуйте войти повторно.' : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (urlMode === 'update-password') {
      setMode('update-password');
    }
  }, [urlMode]);

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
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMessage('Пожалуйста, введите ваш рабочий email');
          setLoading(false);
          return;
        }

        const result = await resetPassword(email);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage('Ссылка для сброса пароля отправлена на указанный email. Проверьте входящие сообщения.');
        }
      } else if (mode === 'update-password') {
        if (newPassword.length < 6) {
          setErrorMessage('Пароль должен содержать минимум 6 символов');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMessage('Пароли не совпадают');
          setLoading(false);
          return;
        }

        const result = await updatePassword(newPassword);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage('Пароль успешно обновлен! Выполняется вход в CRM...');
          setTimeout(() => {
            router.push(redirectTo);
            router.refresh();
          }, 1500);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
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

        {/* Переключатель вкладок Вход в систему / Сброс пароля */}
        {mode !== 'update-password' && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: '#F1F5F9'
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
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
              onClick={() => { setMode('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: mode === 'forgot' ? '#FFFFFF' : 'transparent',
                fontWeight: mode === 'forgot' ? 700 : 500,
                color: mode === 'forgot' ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                borderBottom: mode === 'forgot' ? '2px solid var(--primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Сброс пароля
            </button>
          </div>
        )}

        <div style={{ padding: 32 }}>
          {/* Режим установки нового пароля (после клика по ссылке из email) */}
          {mode === 'update-password' && (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#EFF6FF',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <KeyRound size={20} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>
                Установка нового пароля
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Введите новый пароль для вашей учётной записи в CRM
              </p>
            </div>
          )}

          {/* Описание в режиме сброса пароля */}
          {mode === 'forgot' && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Укажите ваш рабочий email, привязанный к аккаунту сотрудника. Мы отправим вам ссылку для безопасного восстановления доступа.
              </p>
            </div>
          )}

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
            {/* Поле Email (для входа и запроса сброса) */}
            {mode !== 'update-password' && (
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
            )}

            {/* Поле Пароль для входа */}
            {mode === 'signin' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                    Пароль
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
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

            {/* Поля для установки нового пароля */}
            {mode === 'update-password' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    Новый пароль
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Минимум 6 символов"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      style={{ paddingLeft: 38, paddingRight: 38, width: '100%', height: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    Повторите новый пароль
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      style={{ paddingLeft: 38, width: '100%', height: 40 }}
                    />
                  </div>
                </div>
              </>
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
              ) : mode === 'forgot' ? (
                <>
                  <KeyRound size={16} />
                  <span>Отправить ссылку для сброса</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Сохранить новый пароль</span>
                </>
              )}
            </button>
          </form>

          {/* Ссылка возврата ко входу в режиме сброса */}
          {mode === 'forgot' && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Вспомнили пароль? Вернуться ко входу
              </button>
            </div>
          )}
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
