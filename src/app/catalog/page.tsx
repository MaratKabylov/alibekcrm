'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { formatCurrency } from '@/lib/calculator';
import { Package, Layers, Check, Link as LinkIcon, Plus, Info, FileText } from 'lucide-react';

export default function CatalogPage() {
  const { products, categories, priceTiers, priceLists, surchargeRules } = useCRM();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category_id === selectedCategory;
  });

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Каталог упаковки и прайс-лист</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Цены по тиражам в KZT, характеристики стаканов, крышек и коробок
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => setQuoteModalOpen(true)}>
              <FileText size={16} />
              <span>Создать КП по каталогу</span>
            </button>
          </div>
        </div>

        {/* Вкладки категорий */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className="btn btn-secondary btn-sm"
            style={{
              background: selectedCategory === 'all' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: selectedCategory === 'all' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
              color: selectedCategory === 'all' ? '#FCD34D' : '#94A3B8',
            }}
          >
            Все категории ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: selectedCategory === cat.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: selectedCategory === cat.id ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
                  color: selectedCategory === cat.id ? '#FCD34D' : '#94A3B8',
                }}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Сетка товаров с карточками и таблицами ступеней цен (ТЗ п. 4.1 и 4.2) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filteredProducts.map(product => {
            const tiers = priceTiers.filter(t => t.product_id === product.id);
            const category = categories.find(c => c.id === product.category_id);

            return (
              <div key={product.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Фото товара */}
                <div style={{ position: 'relative', height: 180, width: '100%', background: '#0F1218' }}>
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/400x200'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#F59E0B',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {product.sku}
                  </div>
                  {category && (
                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(8px)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      color: '#E2E8F0',
                    }}>
                      {category.name}
                    </div>
                  )}
                </div>

                {/* Описание и характеристики */}
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#FFF' }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14, minHeight: 34 }}>
                    {product.description}
                  </p>

                  {/* Свойства */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {product.volume && (
                      <span className="badge badge-amber" style={{ fontSize: 11 }}>
                        Объем: {product.volume}
                      </span>
                    )}
                    {product.diameter && (
                      <span className="badge badge-sky" style={{ fontSize: 11 }}>
                        Диаметр: {product.diameter}
                      </span>
                    )}
                    {product.material && (
                      <span className="badge badge-indigo" style={{ fontSize: 11 }}>
                        {product.material}
                      </span>
                    )}
                    {product.color && (
                      <span className="badge badge-emerald" style={{ fontSize: 11 }}>
                        {product.color}
                      </span>
                    )}
                  </div>

                  {/* Таблица ступеней цен (Tiers) */}
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 16
                  }}>
                    <div style={{
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      Ступени цен от тиража:
                    </div>
                    {tiers.map((tier, idx) => (
                      <div
                        key={tier.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          fontSize: 12,
                          borderBottom: idx === tiers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <span style={{ color: '#CBD5E1' }}>
                          От {tier.min_quantity.toLocaleString('ru-RU')} шт
                          {tier.max_quantity ? ` до ${tier.max_quantity.toLocaleString('ru-RU')}` : '+'}
                        </span>
                        <strong style={{ color: '#F59E0B' }}>
                          {formatCurrency(tier.unit_price)}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Мин. заказ: {product.min_order_quantity} {product.unit} (в упак. {product.pack_quantity})
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#FCD34D', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                      onClick={() => setQuoteModalOpen(true)}
                    >
                      Рассчитать в КП
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Блок стандартных правил доплат (ТЗ п. 4.3) */}
        <div className="card" style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Layers size={18} color="#F59E0B" />
            <h3 style={{ fontSize: 16 }}>Стандартные сборы и доплаты (клише, печать, усиление)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {surchargeRules.map(rule => (
              <div
                key={rule.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{rule.name}</h4>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>
                    {rule.default_price > 0 ? formatCurrency(rule.default_price) : 'По согласованию'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                  {rule.description}
                </p>
                <div style={{ marginTop: 8 }}>
                  <span className="badge badge-sky" style={{ fontSize: 10 }}>
                    {rule.surcharge_type === 'one_time_fixed' ? 'Разовый сбор' : rule.surcharge_type === 'per_unit' ? 'За 1 стакан' : 'За доп. цвет'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {quoteModalOpen && (
        <QuoteBuilderModal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
        />
      )}
    </>
  );
}
