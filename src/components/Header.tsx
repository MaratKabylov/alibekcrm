'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Bell, 
  RotateCcw, 
  Sun, 
  Moon, 
  X, 
  Package, 
  Briefcase, 
  Building2, 
  User, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useCRM } from '@/lib/store';
import { formatCurrency } from '@/lib/calculator';
import { NotificationCenter } from '@/components/NotificationCenter';

interface HeaderProps {
  onQuickAction?: (action: 'lead' | 'deal' | 'quote' | 'company') => void;
}

export function Header({ onQuickAction }: HeaderProps) {
  const router = useRouter();
  const { 
    tasks, 
    products, 
    priceTiers, 
    categories, 
    deals, 
    companies, 
    contacts, 
    resetToDefault 
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState<'classic' | 'light'>('classic');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLeadAction = () => {
    if (onQuickAction) {
      onQuickAction('lead');
    } else {
      router.push('/leads/new');
    }
  };

  const handleDealAction = () => {
    if (onQuickAction) {
      onQuickAction('deal');
    } else {
      router.push('/deals/new');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('alibek_crm_sidebar_theme') as 'classic' | 'light' | null;
    if (saved) {
      setSidebarTheme(saved);
      document.documentElement.setAttribute('data-sidebar-theme', saved === 'light' ? 'light' : '');
    }
  }, []);

  // Закрытие выпадающего окна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Поиск результатов по сущностям
  const q = searchQuery.toLowerCase().trim();

  const matchingProducts = q ? products.filter(p => {
    const category = categories.find(c => c.id === p.category_id);
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.volume?.toLowerCase().includes(q) ||
      p.diameter?.toLowerCase().includes(q) ||
      p.material?.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      category?.name?.toLowerCase().includes(q)
    );
  }).slice(0, 4) : [];

  const matchingDeals = q ? deals.filter(d => 
    d.title?.toLowerCase().includes(q) ||
    d.notes?.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const matchingCompanies = q ? companies.filter(c => 
    c.name?.toLowerCase().includes(q) ||
    c.phone?.toLowerCase().includes(q) ||
    c.bin_iin?.includes(q)
  ).slice(0, 3) : [];

  const matchingContacts = q ? contacts.filter(c => 
    `${c.first_name} ${c.last_name || ''}`.toLowerCase().includes(q) ||
    c.phone?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const totalResultsCount = matchingProducts.length + matchingDeals.length + matchingCompanies.length + matchingContacts.length;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsDropdownOpen(false);
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectProduct = (sku: string) => {
    setIsDropdownOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(sku)}`);
  };

  // Подсчет незавершенных задач
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <header className="topbar">
      {/* Глобальный поиск согласно ТЗ п. 3.6 с акцентом на Каталог и прайс */}
      <div ref={searchContainerRef} style={{ position: 'relative', width: 380 }}>
        <Search 
          size={16} 
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
        />
        <input
          id="global-crm-search"
          type="text"
          placeholder="Поиск по каталогу, прайсу, сделкам, клиентам..."
          value={searchQuery}
          onFocus={() => {
            if (searchQuery.trim()) setIsDropdownOpen(true);
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(Boolean(e.target.value.trim()));
          }}
          onKeyDown={handleSearchKeyDown}
          className="input"
          style={{ 
            paddingLeft: 38, 
            paddingRight: searchQuery ? 32 : 12,
            height: 38, 
            fontSize: 13,
            background: '#F8FAFC',
            borderColor: isDropdownOpen ? 'var(--primary)' : 'var(--border-subtle)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsDropdownOpen(false);
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}

        {/* Выпадающее окно результатов быстрого поиска */}
        {isDropdownOpen && searchQuery.trim() && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 480,
            maxHeight: 460,
            overflowY: 'auto',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-subtle)',
            zIndex: 1000,
          }}>
            {/* Секция: Товары из каталога и прайса */}
            {matchingProducts.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 14px',
                  background: '#F8FAFC',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #EDF2F7'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={13} />
                    КАТАЛОГ И ПРАЙС-ЛИСТ
                  </span>
                  <span>{matchingProducts.length} поз.</span>
                </div>
                {matchingProducts.map(product => {
                  const tiers = priceTiers.filter(t => t.product_id === product.id);
                  const minPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.unit_price)) : null;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.sku)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img 
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/40'} 
                          alt="" 
                          style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', background: '#F1F5F9' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{product.name}</span>
                            <span style={{ fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                              {product.sku}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 6 }}>
                            {product.volume && <span>{product.volume}</span>}
                            {product.diameter && <span>{product.diameter}</span>}
                            {product.material && <span>{product.material}</span>}
                          </div>
                        </div>
                      </div>

                      {minPrice !== null && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                            от {formatCurrency(minPrice)}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            в прайсе
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Секция: Сделки */}
            {matchingDeals.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 14px',
                  background: '#F8FAFC',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderBottom: '1px solid #EDF2F7'
                }}>
                  <Briefcase size={13} />
                  СДЕЛКИ
                </div>
                {matchingDeals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/deals');
                    }}
                    style={{
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>
                        {deal.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Сумма: {formatCurrency(deal.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Секция: Компании */}
            {matchingCompanies.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 14px',
                  background: '#F8FAFC',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderBottom: '1px solid #EDF2F7'
                }}>
                  <Building2 size={13} />
                  КОМПАНИИ
                </div>
                {matchingCompanies.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/companies');
                    }}
                    style={{
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {c.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Если совсем ничего не нашлось */}
            {totalResultsCount === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Ничего не найдено в CRM</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push(`/catalog?q=${encodeURIComponent(searchQuery)}`);
                  }}
                >
                  <Search size={13} />
                  <span>Искать «{searchQuery}» в каталоге</span>
                </button>
              </div>
            )}

            {/* Нижняя плашка перехода в Каталог с этим поисковым запросом */}
            <div 
              onClick={() => {
                setIsDropdownOpen(false);
                router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
              }}
              style={{
                padding: '10px 14px',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--primary)',
                fontWeight: 600,
                borderTop: '1px solid var(--border-subtle)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
            >
              <span>Показать все результаты поиска по каталогу и прайсу</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Enter <ArrowRight size={13} />
              </span>
            </div>
          </div>
        )}
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

        {/* Центр уведомлений на сайте */}
        <NotificationCenter />

        {/* Быстрое создание */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="header-create-lead-btn"
            onClick={handleLeadAction}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} />
            <span>Новый лид</span>
          </button>
          <button
            id="header-create-deal-btn"
            onClick={handleDealAction}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} />
            <span>Сделка</span>
          </button>
        </div>
      </div>
    </header>
  );
}
