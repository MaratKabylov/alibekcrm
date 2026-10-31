'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { formatCurrency } from '@/lib/calculator';
import { 
  Search, 
  X, 
  FileText, 
  Plus, 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  Filter, 
  Tag, 
  Package, 
  Layers, 
  Check, 
  Info,
  DollarSign,
  RotateCcw
} from 'lucide-react';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const { products, categories, priceTiers } = useCRM();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'under-50' | '50-100' | '100-200' | 'above-200' | 'custom'>('all');
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'min-order'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<string | null>(null);

  // Быстрые теги поиска
  const quickTags = [
    { label: '350 мл', query: '350 мл' },
    { label: '250 мл', query: '250 мл' },
    { label: 'D90', query: 'D90' },
    { label: 'D80', query: 'D80' },
    { label: 'Крафт', query: 'Крафт' },
    { label: 'Белый', query: 'Белый' },
    { label: 'Пицца', query: 'пицц' },
    { label: 'Пироги', query: 'пирог' },
    { label: 'Крышки', query: 'крышк' },
  ];

  // Открытие модалки КП с предварительно выбранным товаром
  const handleOpenQuoteWithProduct = (productId?: string) => {
    setSelectedProductForQuote(productId || null);
    setQuoteModalOpen(true);
  };

  // Сброс всех фильтров
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRangeFilter('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSortBy('default');
  };

  // Фильтрация и поиск
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Поиск по тексту
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const category = categories.find(c => c.id === product.category_id);
        const tiers = priceTiers.filter(t => t.product_id === product.id);
        
        const inName = product.name?.toLowerCase().includes(q);
        const inSku = product.sku?.toLowerCase().includes(q);
        const inDesc = product.description?.toLowerCase().includes(q);
        const inMaterial = product.material?.toLowerCase().includes(q);
        const inVolume = product.volume?.toLowerCase().includes(q);
        const inDiameter = product.diameter?.toLowerCase().includes(q);
        const inColor = product.color?.toLowerCase().includes(q);
        const inDimensions = product.dimensions?.toLowerCase().includes(q);
        const inCategory = category?.name?.toLowerCase().includes(q);
        const inTiers = tiers.some(t => 
          t.unit_price.toString().includes(q) || 
          (t.notes && t.notes.toLowerCase().includes(q))
        );

        if (!inName && !inSku && !inDesc && !inMaterial && !inVolume && !inDiameter && !inColor && !inDimensions && !inCategory && !inTiers) {
          return false;
        }
      }

      // 2. Фильтр по категории
      if (selectedCategory !== 'all') {
        if (product.category_id !== selectedCategory) {
          return false;
        }
      }

      // 3. Фильтр по диапазону цен (проверяем по доступным ступеням цен)
      const tiers = priceTiers.filter(t => t.product_id === product.id);
      const minPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.unit_price)) : 0;
      const maxPrice = tiers.length > 0 ? Math.max(...tiers.map(t => t.unit_price)) : 0;

      if (priceRangeFilter === 'under-50') {
        if (minPrice >= 50) return false;
      } else if (priceRangeFilter === '50-100') {
        if (maxPrice < 50 || minPrice > 100) return false;
      } else if (priceRangeFilter === '100-200') {
        if (maxPrice < 100 || minPrice > 200) return false;
      } else if (priceRangeFilter === 'above-200') {
        if (maxPrice < 200) return false;
      } else if (priceRangeFilter === 'custom') {
        const cMin = customMinPrice ? parseFloat(customMinPrice) : 0;
        const cMax = customMaxPrice ? parseFloat(customMaxPrice) : Infinity;
        if (maxPrice < cMin || minPrice > cMax) return false;
      }

      return true;
    }).sort((a, b) => {
      const tiersA = priceTiers.filter(t => t.product_id === a.id);
      const tiersB = priceTiers.filter(t => t.product_id === b.id);
      const minPriceA = tiersA.length > 0 ? Math.min(...tiersA.map(t => t.unit_price)) : 0;
      const minPriceB = tiersB.length > 0 ? Math.min(...tiersB.map(t => t.unit_price)) : 0;
      const maxPriceA = tiersA.length > 0 ? Math.max(...tiersA.map(t => t.unit_price)) : 0;
      const maxPriceB = tiersB.length > 0 ? Math.max(...tiersB.map(t => t.unit_price)) : 0;

      if (sortBy === 'price-asc') {
        return minPriceA - minPriceB;
      }
      if (sortBy === 'price-desc') {
        return maxPriceB - maxPriceA;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'ru');
      }
      if (sortBy === 'min-order') {
        return a.min_order_quantity - b.min_order_quantity;
      }
      return 0; // default
    });
  }, [products, categories, priceTiers, searchQuery, selectedCategory, priceRangeFilter, customMinPrice, customMaxPrice, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || 
    selectedCategory !== 'all' || 
    priceRangeFilter !== 'all' || 
    sortBy !== 'default'
  );

  return (
    <>
      <Header />

      <div className="page-wrapper">
        {/* Верхняя строка заголовка и действие */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={22} color="var(--primary)" />
              Каталог упаковки и прайс-лист
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Поиск по наименованию, артикулу (SKU), ступеням цен от объема, размерам и характеристикам
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleOpenQuoteWithProduct()}
              style={{ boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
            >
              <FileText size={15} />
              <span>Создать КП по каталогу</span>
            </button>
          </div>
        </div>

        {/* Главный блок поиска и фильтрации */}
        <div className="card" style={{ padding: 18, marginBottom: 20, background: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }}>
          {/* Строка поиска */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                id="catalog-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по артикулу (напр. CUP-350, D90, BOX), названию, материалу, объему или цене..."
                className="input"
                style={{
                  paddingLeft: 42,
                  paddingRight: searchQuery ? 38 : 14,
                  height: 42,
                  fontSize: 14,
                  background: '#F8FAFC',
                  borderColor: searchQuery ? 'var(--primary)' : 'var(--border-subtle)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  title="Очистить поиск"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Переключатель вида (Сетка / Таблица) */}
            <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="btn"
                style={{
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 0,
                  border: 'none',
                  background: viewMode === 'grid' ? 'var(--primary-light)' : '#FFFFFF',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'grid' ? 600 : 400,
                  gap: 6
                }}
                title="Вид: Сетка карточек"
              >
                <LayoutGrid size={15} />
                <span style={{ fontSize: 13 }}>Карточки</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="btn"
                style={{
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 0,
                  border: 'none',
                  borderLeft: '1px solid var(--border-subtle)',
                  background: viewMode === 'table' ? 'var(--primary-light)' : '#FFFFFF',
                  color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'table' ? 600 : 400,
                  gap: 6
                }}
                title="Вид: Таблица прайс-листа"
              >
                <List size={15} />
                <span style={{ fontSize: 13 }}>Прайс-таблица</span>
              </button>
            </div>
          </div>

          {/* Быстрые теги */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
              <Tag size={13} /> Быстрый подбор:
            </span>
            {quickTags.map((tag) => {
              const isActive = searchQuery.toLowerCase() === tag.query.toLowerCase();
              return (
                <button
                  key={tag.label}
                  onClick={() => setSearchQuery(isActive ? '' : tag.query)}
                  className="badge"
                  style={{
                    background: isActive ? 'var(--primary)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 14,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>

          {/* Фильтры второй линии: Категории, Диапазон цен, Сортировка */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 12,
            paddingTop: 14,
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {/* Вкладки категорий */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory('all')}
                className="btn btn-secondary btn-sm"
                style={{
                  background: selectedCategory === 'all' ? 'var(--primary-light)' : '#FFFFFF',
                  borderColor: selectedCategory === 'all' ? 'var(--primary-border)' : 'var(--border-subtle)',
                  color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: selectedCategory === 'all' ? 600 : 500,
                  fontSize: 12,
                }}
              >
                Все ({products.length})
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
                      fontSize: 12,
                    }}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Фильтр по цене и сортировка */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цена:</span>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value as any)}
                  className="input"
                  style={{ height: 32, fontSize: 12, padding: '0 8px', width: 140 }}
                >
                  <option value="all">Любая цена</option>
                  <option value="under-50">До 50 ₸</option>
                  <option value="50-100">50 – 100 ₸</option>
                  <option value="100-200">100 – 200 ₸</option>
                  <option value="above-200">От 200 ₸</option>
                  <option value="custom">Свой диапазон...</option>
                </select>
              </div>

              {priceRangeFilter === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    placeholder="От"
                    value={customMinPrice}
                    onChange={(e) => setCustomMinPrice(e.target.value)}
                    className="input"
                    style={{ width: 65, height: 32, fontSize: 12, padding: '0 6px' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                  <input
                    type="number"
                    placeholder="До"
                    value={customMaxPrice}
                    onChange={(e) => setCustomMaxPrice(e.target.value)}
                    className="input"
                    style={{ width: 65, height: 32, fontSize: 12, padding: '0 6px' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₸</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowUpDown size={14} color="var(--text-muted)" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input"
                  style={{ height: 32, fontSize: 12, padding: '0 8px', width: 165 }}
                >
                  <option value="default">Сортировка: Стандарт</option>
                  <option value="price-asc">Сначала дешевле (мин. цена)</option>
                  <option value="price-desc">Сначала дороже</option>
                  <option value="name-asc">По названию (А-Я)</option>
                  <option value="min-order">По мин. тиражу</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 4, color: 'var(--text-secondary)', height: 32 }}
                  title="Сбросить все параметры поиска"
                >
                  <RotateCcw size={12} />
                  <span>Сброс</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Строка статуса результатов */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          padding: '0 4px',
          fontSize: 13,
          color: 'var(--text-secondary)'
        }}>
          <div>
            Найдено товаров: <strong style={{ color: 'var(--text-main)' }}>{filteredProducts.length}</strong> из {products.length}
            {searchQuery && (
              <span> по запросу «<strong style={{ color: 'var(--primary)' }}>{searchQuery}</strong>»</span>
            )}
          </div>
          {filteredProducts.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              * Все цены указаны в тенге (KZT) с учетом ступенчатых тиражей
            </div>
          )}
        </div>

        {/* Если ничего не найдено */}
        {filteredProducts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF' }}>
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              background: '#F1F5F9', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px',
              color: 'var(--text-muted)'
            }}>
              <Search size={26} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
              По вашему запросу ничего не найдено
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto 20px' }}>
              Попробуйте изменить запрос, проверить правильность артикула или сбросить фильтры по категориям и ценам.
            </p>
            <button className="btn btn-primary" onClick={handleResetFilters}>
              <RotateCcw size={14} />
              <span>Сбросить все фильтры</span>
            </button>
          </div>
        )}

        {/* 1. ВИД: СЕТКА КАРТОЧЕК С ТОВАРАМИ И СТУПЕНЯМИ ЦЕН */}
        {viewMode === 'grid' && filteredProducts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
            {filteredProducts.map(product => {
              const tiers = priceTiers.filter(t => t.product_id === product.id);
              const category = categories.find(c => c.id === product.category_id);
              const lowestTierPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.unit_price)) : null;

              return (
                <div 
                  key={product.id} 
                  className="card" 
                  style={{ 
                    padding: 0, 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  {/* Фото товара с бейджами */}
                  <div style={{ position: 'relative', height: 180, width: '100%', background: '#F1F5F9' }}>
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/400x200?text=PackCoffee'}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {product.sku}
                    </div>

                    {category && (
                      <div style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#FFFFFF',
                      }}>
                        {category.name}
                      </div>
                    )}

                    {lowestTierPrice !== null && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(37,99,235,0.4)'
                      }}>
                        от {formatCurrency(lowestTierPrice)}
                      </div>
                    )}
                  </div>

                  {/* Описание и характеристики */}
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, minHeight: 32, lineHeight: 1.4 }}>
                      {product.description}
                    </p>

                    {/* Свойства / Характеристики */}
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
                      {product.dimensions && (
                        <span className="badge badge-emerald" style={{ fontSize: 11 }}>
                          {product.dimensions}
                        </span>
                      )}
                      {product.color && (
                        <span className="badge badge-emerald" style={{ fontSize: 11 }}>
                          Цвет: {product.color}
                        </span>
                      )}
                      {product.layers && (
                        <span className="badge badge-sky" style={{ fontSize: 11 }}>
                          {product.layers}
                        </span>
                      )}
                    </div>

                    {/* Таблица ступеней цен (Tiers) */}
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      marginBottom: 16,
                      marginTop: 'auto'
                    }}>
                      <div style={{
                        padding: '6px 10px',
                        background: '#F1F5F9',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Ступени цен от тиража:</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>цена за 1 шт</span>
                      </div>
                      {tiers.length === 0 ? (
                        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
                          Цены уточняются индивидуально
                        </div>
                      ) : (
                        tiers.map((tier, idx) => {
                          const isLowest = tier.unit_price === lowestTierPrice;
                          return (
                            <div
                              key={tier.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                fontSize: 12,
                                background: isLowest ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                                borderBottom: idx === tiers.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                              }}
                            >
                              <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>
                                  От <strong>{tier.min_quantity.toLocaleString('ru-RU')}</strong> шт
                                  {tier.max_quantity ? ` до ${tier.max_quantity.toLocaleString('ru-RU')}` : '+'}
                                </span>
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <strong style={{ color: isLowest ? 'var(--primary)' : 'var(--text-main)' }}>
                                  {formatCurrency(tier.unit_price)}
                                </strong>
                                {isLowest && (
                                  <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600 }}>
                                    (топ)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Подвал карточки с мин. заказом и кнопкой добавления в КП */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Мин. заказ: <strong>{product.min_order_quantity.toLocaleString('ru-RU')}</strong> {product.unit} 
                        {product.pack_quantity > 1 && ` (упак. ${product.pack_quantity} шт)`}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ 
                          color: 'var(--primary)', 
                          borderColor: 'var(--primary-border)',
                          background: 'var(--primary-light)',
                          fontWeight: 600,
                          gap: 5
                        }}
                        onClick={() => handleOpenQuoteWithProduct(product.id)}
                        title="Добавить этот товар в расчет коммерческого предложения"
                      >
                        <Plus size={14} />
                        <span>В КП</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. ВИД: СВОДНАЯ ТАБЛИЦА ПРАЙС-ЛИСТА (МАТРИЦА ЦЕН) */}
        {viewMode === 'table' && filteredProducts.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', width: 110 }}>Артикул</th>
                    <th style={{ padding: '10px 14px' }}>Товар и параметры</th>
                    <th style={{ padding: '10px 14px', width: 150 }}>Категория</th>
                    <th style={{ padding: '10px 14px', width: 140 }}>Мин. тираж</th>
                    <th style={{ padding: '10px 14px', minWidth: 260 }}>Ступени цен от объема (KZT/шт)</th>
                    <th style={{ padding: '10px 14px', width: 130, textAlign: 'right' }}>Лучшая цена</th>
                    <th style={{ padding: '10px 14px', width: 100, textAlign: 'center' }}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const tiers = priceTiers.filter(t => t.product_id === product.id);
                    const category = categories.find(c => c.id === product.category_id);
                    const lowestTierPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.unit_price)) : null;

                    return (
                      <tr 
                        key={product.id}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        {/* Артикул */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: 12, 
                            fontWeight: 700, 
                            color: 'var(--primary)',
                            background: 'var(--primary-light)',
                            padding: '3px 6px',
                            borderRadius: 4
                          }}>
                            {product.sku}
                          </span>
                        </td>

                        {/* Товар и параметры */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <img
                              src={product.images?.[0]?.url || 'https://via.placeholder.com/60?text=Pack'}
                              alt={product.name}
                              style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', background: '#F1F5F9', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                                {product.name}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 11 }}>
                                {product.volume && <span className="badge badge-amber" style={{ padding: '2px 6px' }}>{product.volume}</span>}
                                {product.diameter && <span className="badge badge-sky" style={{ padding: '2px 6px' }}>{product.diameter}</span>}
                                {product.material && <span className="badge badge-indigo" style={{ padding: '2px 6px' }}>{product.material}</span>}
                                {product.dimensions && <span className="badge badge-emerald" style={{ padding: '2px 6px' }}>{product.dimensions}</span>}
                                {product.color && <span className="badge badge-emerald" style={{ padding: '2px 6px' }}>{product.color}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Категория */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                          {category?.name || '—'}
                        </td>

                        {/* Мин. заказ */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {product.min_order_quantity.toLocaleString('ru-RU')} {product.unit}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            В упаковке: {product.pack_quantity} {product.unit}
                          </div>
                        </td>

                        {/* Ступени цен */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {tiers.map((t) => (
                              <div 
                                key={t.id} 
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  fontSize: 12,
                                  background: '#F8FAFC',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #EDF2F7'
                                }}
                              >
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  от {t.min_quantity.toLocaleString('ru-RU')} шт
                                  {t.max_quantity ? ` до ${t.max_quantity.toLocaleString('ru-RU')}` : '+'}
                                </span>
                                <strong style={{ color: t.unit_price === lowestTierPrice ? 'var(--primary)' : 'var(--text-main)' }}>
                                  {formatCurrency(t.unit_price)}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Лучшая цена */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'right' }}>
                          {lowestTierPrice !== null ? (
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                                {formatCurrency(lowestTierPrice)}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                от макс. тиража
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Действие */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              color: 'var(--primary)', 
                              borderColor: 'var(--primary-border)',
                              background: 'var(--primary-light)',
                              fontWeight: 600,
                              gap: 4
                            }}
                            onClick={() => handleOpenQuoteWithProduct(product.id)}
                            title="Сформировать коммерческое предложение"
                          >
                            <Plus size={13} />
                            <span>В КП</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно создания КП с предварительно выбранным товаром */}
      {quoteModalOpen && (
        <QuoteBuilderModal
          key={selectedProductForQuote || 'quote-modal'}
          isOpen={quoteModalOpen}
          initialProductId={selectedProductForQuote || undefined}
          onClose={() => {
            setQuoteModalOpen(false);
            setSelectedProductForQuote(null);
          }}
        />
      )}
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Загрузка каталога и прайс-листа...
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
