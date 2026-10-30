'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, RotateCcw, Palette, Sun, Moon } from 'lucide-react';
import { useCRM } from '@/lib/store';

interface HeaderProps {
  onQuickAction?: (action: 'lead' | 'deal' | 'quote' | 'company') => void;
}

export function Header({ onQuickAction }: HeaderProps) {
  const { tasks, resetToDefault } = useCRM();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTheme, setSidebarTheme] = useState<'classic' | 'light'>('classic');

  useEffect(() => {
    const saved = localStorage.getItem('alibek_crm_sidebar_theme') as 'classic' | 'light' | null;
    if (saved) {
      setSidebarTheme(saved);
      document.documentElement.setAttribute('data-sidebar-theme', saved === 'light' ? 'light' : '');
    }
  }, []);

  const toggleSidebarTheme = () => {
    const next = sidebarTheme === 'classic' ? 'light' : 'classic';
    setSidebarTheme(next);
    localStorage.setItem('alibek_crm_sidebar_theme', next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-sidebar-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-sidebar-theme');
    }
  };

  // Подсчет незавершенных задач
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <header className="topbar">
      {/* Глобальный поиск согласно ТЗ п. 3.6 */}
      <div style={{ position: 'relative', width: 340 }}>
        <Search 
          size={16} 
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
        />
        <input
          id="global-crm-search"
          type="text"
          placeholder="Поиск по клиентам, сделкам, телефонам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ 
            paddingLeft: 38, 
            height: 38, 
            fontSize: 13,
            background: '#F8FAFC',
            borderColor: 'var(--border-subtle)'
          }}
        />
      </div>

      {/* Правая панель действий */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Переключатель стиля меню: EspoCRM Classic vs EspoCRM Light */}
        <button
          onClick={toggleSidebarTheme}
          className="btn btn-secondary btn-sm"
          title={`Текущий стиль: ${sidebarTheme === 'classic' ? 'EspoCRM Classic (тёмное меню)' : 'EspoCRM Light (светлое меню)'}. Нажмите для смены.`}
          style={{ gap: 6, fontSize: 12 }}
        >
          {sidebarTheme === 'classic' ? <Sun size={14} color="#2563EB" /> : <Moon size={14} color="#475569" />}
          <span>{sidebarTheme === 'classic' ? 'EspoCRM Классик' : 'EspoCRM Светлый'}</span>
        </button>

        {/* Кнопка сброса к демо-данным (для тестирования) */}
        <button
          onClick={() => {
            if (confirm('Сбросить данные к первоначальным демо-данным из ТЗ?')) {
              resetToDefault();
            }
          }}
          className="btn btn-secondary btn-sm"
          title="Сбросить состояние к демо ТЗ"
        >
          <RotateCcw size={13} />
          <span>Демо ТЗ</span>
        </button>

        {/* Индикатор уведомлений/задач */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: 36, height: 36, padding: 0, borderRadius: 'var(--radius-sm)' }}
            title="Задачи в работе"
          >
            <Bell size={16} />
          </button>
          {pendingTasksCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.4)'
            }}>
              {pendingTasksCount}
            </span>
          )}
        </div>

        {/* Быстрое создание */}
        {onQuickAction && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="header-create-lead-btn"
              onClick={() => onQuickAction('lead')}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>Новый лид</span>
            </button>
            <button
              id="header-create-deal-btn"
              onClick={() => onQuickAction('deal')}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              <span>Сделка</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
