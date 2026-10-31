'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Product, PriceTier, Category } from '@/types/database';
import { 
  X, 
  Package, 
  Plus, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  DollarSign, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

interface TierRow {
  id?: string;
  min_quantity: number;
  max_quantity?: number | null;
  unit_price: number;
  notes?: string;
}

export function ProductModal({ isOpen, onClose, productToEdit }: ProductModalProps) {
  const { categories, priceTiers, addProduct, updateProduct, deleteProduct, addCategory } = useCRM();

  // Основные поля товара
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [unit, setUnit] = useState('шт');
  const [minOrderQuantity, setMinOrderQuantity] = useState(1000);
  const [packQuantity, setPackQuantity] = useState(50);
  const [orderStep, setOrderStep] = useState(500);

  // Характеристики
  const [volume, setVolume] = useState('');
  const [diameter, setDiameter] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [layers, setLayers] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Ступени цен (Price Tiers)
  const [tiers, setTiers] = useState<TierRow[]>([
    { min_quantity: 1000, max_quantity: 4999, unit_price: 35, notes: 'Стандартный тираж' },
    { min_quantity: 5000, max_quantity: 9999, unit_price: 30, notes: 'От 5 000 шт' },
    { min_quantity: 10000, max_quantity: null, unit_price: 25, notes: 'Опт от 10 000 шт' },
  ]);

  const [errorMessage, setErrorMessage] = useState('');

  // Заполнение формы при редактировании
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setCategoryId(productToEdit.category_id || categories[0]?.id || '');
      setUnit(productToEdit.unit || 'шт');
      setMinOrderQuantity(productToEdit.min_order_quantity || 1000);
      setPackQuantity(productToEdit.pack_quantity || 50);
      setOrderStep(productToEdit.order_step || 500);
      setVolume(productToEdit.volume || '');
      setDiameter(productToEdit.diameter || '');
      setMaterial(productToEdit.material || '');
      setColor(productToEdit.color || '');
      setDimensions(productToEdit.dimensions || '');
      setLayers(productToEdit.layers || '');
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.images?.[0]?.url || '');

      const existingTiers = priceTiers
        .filter(t => t.product_id === productToEdit.id)
        .sort((a, b) => a.min_quantity - b.min_quantity);

      if (existingTiers.length > 0) {
        setTiers(existingTiers.map(t => ({
          id: t.id,
          min_quantity: t.min_quantity,
          max_quantity: t.max_quantity,
          unit_price: t.unit_price,
          notes: t.notes || '',
        })));
      } else {
        setTiers([{ min_quantity: 1000, max_quantity: null, unit_price: 40, notes: 'Базовая цена' }]);
      }
    } else {
      // Сброс на значения по умолчанию для нового товара
      setName('');
      setSku('');
      setCategoryId(categories[0]?.id || '');
      setUnit('шт');
      setMinOrderQuantity(1000);
      setPackQuantity(50);
      setOrderStep(500);
      setVolume('');
      setDiameter('');
      setMaterial('');
      setColor('');
      setDimensions('');
      setLayers('');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80');
      setTiers([
        { min_quantity: 1000, max_quantity: 4999, unit_price: 35, notes: 'От 1 000 шт' },
        { min_quantity: 5000, max_quantity: 9999, unit_price: 30, notes: 'От 5 000 шт' },
        { min_quantity: 10000, max_quantity: null, unit_price: 25, notes: 'От 10 000 шт' },
      ]);
    }
    setErrorMessage('');
    setIsCreatingCategory(false);
  }, [productToEdit, isOpen, categories, priceTiers]);

  if (!isOpen) return null;

  // Генерация артикула
  const handleGenerateSku = () => {
    let prefix = 'PROD';
    if (name.toLowerCase().includes('стакан')) prefix = 'CUP';
    else if (name.toLowerCase().includes('крышк')) prefix = 'LID';
    else if (name.toLowerCase().includes('пицц')) prefix = 'BOX-PIZZA';
    else if (name.toLowerCase().includes('пирог') || name.toLowerCase().includes('торт')) prefix = 'BOX-PIE';

    let vol = volume.replace(/\D/g, '');
    let diam = diameter.replace(/\s+/g, '').toUpperCase();
    let suffix = vol ? `-${vol}` : (diam ? `-${diam}` : `-${Math.floor(100 + Math.random() * 900)}`);
    setSku(`${prefix}${suffix}`);
  };

  // Быстрые ссылки на фото
  const imagePresets = [
    { label: 'Стакан крафт', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
    { label: 'Стакан белый', url: 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&auto=format&fit=crop&q=80' },
    { label: 'Крышка черная', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=80' },
    { label: 'Коробка пицца', url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&auto=format&fit=crop&q=80' },
    { label: 'Коробка крафт', url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&auto=format&fit=crop&q=80' },
  ];

  // Добавление новой категории
  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-');
    const created = addCategory({ name: newCategoryName.trim(), slug });
    setCategoryId(created.id);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  // Управление ступенями цен
  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier && lastTier.max_quantity ? lastTier.max_quantity + 1 : (lastTier ? lastTier.min_quantity + 5000 : 1000);
    const nextPrice = lastTier ? Math.max(1, Math.round(lastTier.unit_price * 0.9 * 10) / 10) : 30;

    setTiers([...tiers, {
      min_quantity: nextMin,
      max_quantity: null,
      unit_price: nextPrice,
      notes: `От ${nextMin.toLocaleString('ru-RU')} шт`,
    }]);
  };

  const handleUpdateTier = (index: number, updates: Partial<TierRow>) => {
    setTiers(tiers.map((t, idx) => idx === index ? { ...t, ...updates } : t));
  };

  const handleDeleteTier = (index: number) => {
    if (tiers.length <= 1) {
      alert('У товара должна быть как минимум одна ступень цены.');
      return;
    }
    setTiers(tiers.filter((_, idx) => idx !== index));
  };

  // Сохранение товара
  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('Укажите наименование товара');
      return;
    }
    if (!sku.trim()) {
      setErrorMessage('Укажите уникальный артикул (SKU)');
      return;
    }

    // Проверка ступеней цен
    for (const t of tiers) {
      if (t.min_quantity <= 0) {
        setErrorMessage('Минимальный тираж в ступени цен должен быть больше 0');
        return;
      }
      if (t.unit_price <= 0) {
        setErrorMessage('Цена за единицу товара должна быть больше 0 ₸');
        return;
      }
    }

    const productPayload: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category_id: categoryId || categories[0]?.id || null,
      unit: unit.trim() || 'шт',
      min_order_quantity: Number(minOrderQuantity) || 1000,
      pack_quantity: Number(packQuantity) || 50,
      order_step: Number(orderStep) || 500,
      volume: volume.trim() || null,
      diameter: diameter.trim() || null,
      material: material.trim() || null,
      color: color.trim() || null,
      dimensions: dimensions.trim() || null,
      layers: layers.trim() || null,
      description: description.trim() || null,
      is_active: true,
      images: imageUrl.trim() ? [{ url: imageUrl.trim(), is_primary: true }] : [],
    };

    const tiersPayload = tiers.map(t => ({
      min_quantity: Number(t.min_quantity),
      max_quantity: t.max_quantity ? Number(t.max_quantity) : null,
      unit_price: Number(t.unit_price),
      notes: t.notes || null,
    }));

    if (productToEdit) {
      updateProduct(productToEdit.id, productPayload, tiersPayload);
    } else {
      addProduct(productPayload, tiersPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!productToEdit) return;
    if (confirm(`Вы уверены, что хотите удалить товар "${productToEdit.name}" (${productToEdit.sku}) из каталога?`)) {
      deleteProduct(productToEdit.id);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 16,
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 780,
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Шапка модального окна */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {productToEdit ? 'Редактирование товара' : 'Добавление товара в каталог'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Задайте характеристики и ступени оптовых цен от тиража
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Сообщение об ошибке */}
        {errorMessage && (
          <div style={{
            margin: '14px 22px 0',
            padding: '10px 14px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 6,
            color: '#B91C1C',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Тело формы */}
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Секция 1: Основная информация */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={15} color="var(--primary)" /> 1. Основные данные
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Наименование товара *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. Двухслойный крафтовый стакан 350 мл"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
                    Артикул (SKU) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                    title="Сгенерировать артикул автоматически"
                  >
                    <Sparkles size={11} /> авто
                  </button>
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. CUP-350-2L"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  style={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Категория
                </label>
                {!isCreatingCategory ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      className="input"
                      value={categoryId}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setIsCreatingCategory(true);
                        } else {
                          setCategoryId(e.target.value);
                        }
                      }}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                      <option value="new">+ Новая категория...</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Название новой категории"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAddNewCategory}>
                      <Check size={14} />
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreatingCategory(false)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Единица
                </label>
                <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="шт">шт (штука)</option>
                  <option value="упак">упак (упаковка)</option>
                  <option value="компл">компл (комплект)</option>
                </select>
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Мин. тираж (шт)
                </label>
                <input
                  type="number"
                  className="input"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Секция 2: Характеристики упаковки */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={15} color="var(--primary)" /> 2. Характеристики и размеры
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Объем</label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. 350 мл, 400 мл"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                />
              </div>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Диаметр горла</label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. D90, D80"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                />
              </div>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Материал</label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. Картон 280 г/м², PP"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Цвет</label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. Крафт, Белый, Черный"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Габариты (Д×Ш×В)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. 30×30×4 см"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                />
              </div>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Слойность</label>
                <input
                  type="text"
                  className="input"
                  placeholder="напр. Однослойный, Двухслойный"
                  value={layers}
                  onChange={(e) => setLayers(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ fontSize: 11 }}>Описание</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Краткое описание товара для менеджеров и клиентов..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Секция 3: Фото товара */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={15} color="var(--primary)" /> 3. Фотография товара
            </h4>
            
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img
                src={imageUrl || 'https://via.placeholder.com/80?text=No+Photo'}
                alt=""
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 6,
                  objectFit: 'cover',
                  border: '1px solid var(--border-subtle)',
                  background: '#F1F5F9'
                }}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="URL изображения (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ marginBottom: 6, fontSize: 12 }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Быстрые шаблоны:</span>
                  {imagePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 10,
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Секция 4: Ступени цен от тиража (Прайс-лист) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={15} color="var(--primary)" /> 4. Ступени цен от объема тиража (KZT / ₸)
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Цена за 1 единицу продукции в зависимости от объема партии
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddTier}
                style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
              >
                <Plus size={13} />
                <span>Добавить ступень</span>
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: 140 }}>Тираж от (шт)</th>
                    <th style={{ padding: '8px 10px', width: 140 }}>Тираж до (шт)</th>
                    <th style={{ padding: '8px 10px', width: 160 }}>Цена за 1 шт (₸) *</th>
                    <th style={{ padding: '8px 10px' }}>Примечание</th>
                    <th style={{ padding: '8px 10px', width: 44, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === tiers.length - 1 ? 'none' : '1px solid #EDF2F7' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          className="input"
                          style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                          value={tier.min_quantity}
                          onChange={(e) => handleUpdateTier(idx, { min_quantity: Number(e.target.value) })}
                          min={1}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          className="input"
                          style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                          placeholder="без ограничений"
                          value={tier.max_quantity === null || tier.max_quantity === undefined ? '' : tier.max_quantity}
                          onChange={(e) => handleUpdateTier(idx, { max_quantity: e.target.value ? Number(e.target.value) : null })}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            step="0.1"
                            className="input"
                            style={{ height: 32, fontSize: 12, padding: '0 8px', fontWeight: 700, color: 'var(--primary)' }}
                            value={tier.unit_price}
                            onChange={(e) => handleUpdateTier(idx, { unit_price: Number(e.target.value) })}
                            min={0.1}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₸</span>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="text"
                          className="input"
                          style={{ height: 32, fontSize: 12, padding: '0 8px' }}
                          placeholder="напр. От 5 000 шт"
                          value={tier.notes || ''}
                          onChange={(e) => handleUpdateTier(idx, { notes: e.target.value })}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                          }}
                          title="Удалить ступень"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Подвал с кнопками */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
          borderBottomLeftRadius: 'var(--radius-lg)',
          borderBottomRightRadius: 'var(--radius-lg)',
        }}>
          <div>
            {productToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-secondary btn-sm"
                style={{ color: '#EF4444', borderColor: '#FCA5A5', background: '#FEF2F2' }}
              >
                <Trash2 size={14} />
                <span>Удалить товар</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Отмена
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              <Check size={15} />
              <span>{productToEdit ? 'Сохранить изменения' : 'Добавить в каталог'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

