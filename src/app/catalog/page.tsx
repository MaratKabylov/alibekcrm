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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Каталог упаковки и прайс-лист</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Цены по тиражам в KZT, характеристики стаканов, крышек и коробок
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => setQuoteModalOpen(true)}>
              <FileText size={15} />
              <span>Создать КП по каталогу</span>
            </button>
          </div>
        </div>

        {/* Вкладки категорий */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className="btn btn-secondary btn-sm"
            style={{
              background: selectedCategory === 'all' ? 'var(--primary-light)' : '#FFFFFF',
              borderColor: selectedCategory === 'all' ? 'var(--primary-border)' : 'var(--border-subtle)',
              color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: selectedCategory === 'all' ? 600 : 500,
            }}
          >
            Все категории ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: isSelected ? 'var(--primary-light)' : '#FFFFFF',
                  borderColor: isSelected ? 'var(--primary-border)' : 'var(--border-subtle)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Сетка товаров с карточками и таблицами ступеней цен (ТЗ п. 4.1 и 4.2) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filteredProducts.map(product => {
            const tiers = priceTiers.filter(t => t.product_id === product.id);
            const category = categories.find(c => c.id === product.category_id);

            return (
              <div key={product.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Фото товара */}
                <div style={{ position: 'relative', height: 180, width: '100%', background: '#F1F5F9' }}>
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/400x200'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#FFFFFF'
                  }}>
                    {product.sku}
                  </div>
                  {category && (
                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      color: '#FFFFFF',
                    }}>
                      {category.name}
                    </div>
                  )}
                </div>

                {/* Описание и характеристики */}
                <div style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, minHeight: 32 }}>
                    {product.description}
                  </p>

                  {/* Свойства */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
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
                    background: '#F8FAFC',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    marginBottom: 14
                  }}>
                    <div style={{
                      padding: '6px 10px',
                      background: '#F1F5F9',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
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
                          borderBottom: idx === tiers.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <span style={{ color: 'var(--text-main)' }}>
                          От {tier.min_quantity.toLocaleString('ru-RU')} шт
                          {tier.max_quantity ? ` до ${tier.max_quantity.toLocaleString('ru-RU')}` : '+'}
                        </span>
                        <strong style={{ color: 'var(--primary)' }}>
                          {formatCurrency(tier.unit_price)}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Мин. заказ: {product.min_order_quantity} {product.unit} (в упак. {product.pack_quantity})
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                      onClick={() => setQuoteModalOpen(true)}
                    >
                      <Plus size={13} />
                      <span>В КП</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
