'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users2, 
  Building2, 
  Contact2, 
  Kanban, 
  CheckSquare2, 
  Package, 
  FileText, 
  Settings,
  Coffee,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/leads', label: 'Лиды', icon: Users2 },
  { href: '/deals', label: 'Сделки (Канбан)', icon: Kanban },
  { href: '/companies', label: 'Компании', icon: Building2 },
  { href: '/contacts', label: 'Контакты', icon: Contact2 },
  { href: '/tasks', label: 'Задачи', icon: CheckSquare2 },
  { href: '/catalog', label: 'Каталог и Прайс', icon: Package },
  { href: '/quotes', label: 'КП (Предложения)', icon: FileText },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Алибек М.';
  const roleLabel = profile?.role === 'admin' ? 'Администратор' : 'Менеджер';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'AM';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)'
        }}>
          <Coffee size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--sidebar-logo-title)' }}>
            Alibek CRM
          </h2>
          <p style={{ fontSize: 11, color: 'var(--sidebar-logo-sub)', fontWeight: 500 }}>
            Упаковка для кофеен
          </p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Профиль сотрудника внизу сайдбара */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--sidebar-footer-bg)',
        transition: 'background-color 0.2s ease'
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: '#FFFFFF',
          flexShrink: 0
        }}>
          {getInitials(displayName)}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div 
            style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: 'var(--sidebar-footer-text)', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden',
              textOverflow: 'ellipsis' 
            }}
            title={displayName}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
            {roleLabel}
          </div>
        </div>

        {/* Кнопка выхода */}
        <button
          onClick={() => signOut()}
          className="btn btn-secondary btn-sm"
          style={{
            padding: 6,
            height: 30,
            width: 30,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          title="Выйти из системы"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
