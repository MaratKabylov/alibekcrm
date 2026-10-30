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
  Coffee
} from 'lucide-react';

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
          color: '#FFFFFF'
        }}>
          АМ
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sidebar-footer-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            Алибек М.
          </div>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
            Администратор
          </div>
        </div>
      </div>
    </aside>
  );
}
