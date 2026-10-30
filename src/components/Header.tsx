'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, RotateCcw } from 'lucide-react';
import { useCRM } from '@/lib/store';

interface HeaderProps {
  onQuickAction?: (action: 'lead' | 'deal' | 'quote' | 'company') => void;
}

export function Header({ onQuickAction }: HeaderProps) {
  const { tasks, resetToDefault } = useCRM();
  const [searchQuery, setSearchQuery] = useState('');

  // Подсчет просроченных задач и задач на сегодня
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <header className="topbar">
      {/* Глобальный поиск согласно ТЗ п. 3.6 */}
      <div style={{ position: 'relative', width: 340 }}>
        <Search 
          size={16} 
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} 
        />
        <input
          id="global-crm-search"
          type="text"
          placeholder="Поиск по клиентам, сделкам, телефонам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ paddingLeft: 38, height: 38, fontSize: 13 }}
        />
      </div>

      {/* Правая панель действий */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Кнопка сброса к демо-данным (для тестирования) */}
        <button
          onClick={() => {
            if (confirm('Сбросить данные к первоначальным демо-данным из ТЗ?')) {
              resetToDefault();
            }
          }}
          className="btn btn-secondary btn-sm"
          title="Сбросить состояние"
          style={{ color: '#94A3B8' }}
        >
          <RotateCcw size={14} />
          <span>Демо ТЗ</span>
        </button>

        {/* Индикатор уведомлений/задач */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: 38, height: 38, padding: 0, borderRadius: '50%' }}
            title="Задачи"
          >
            <Bell size={16} />
          </button>
          {pendingTasksCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: '#F59E0B',
              color: '#000',
              fontSize: 10,
              fontWeight: 800,
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
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
              <Plus size={15} />
              <span>Новый лид</span>
            </button>
            <button
              id="header-create-deal-btn"
              onClick={() => onQuickAction('deal')}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={15} />
              <span>Сделка</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
