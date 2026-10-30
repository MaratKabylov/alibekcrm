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
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <Coffee size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFF' }}>Alibek CRM</h2>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Упаковка для кофеен</p>
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
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Профиль сотрудника внизу сайдбара */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#FFF'
        }}>
          АМ
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            Алибек М.
          </div>
          <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
            Администратор
          </div>
        </div>
      </div>
    </aside>
  );
}
