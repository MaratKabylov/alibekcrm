'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Product, QuoteItem, QuoteCharge, SurchargeRule } from '@/types/database';
import { findTierPrice, calculateItemTotal, calculateChargeTotal, formatCurrency, roundCurrency } from '@/lib/calculator';
import { X, Plus, Trash2, Printer, CheckCircle2, AlertCircle, FileText, Sparkles, Download, ExternalLink, Loader2 } from 'lucide-react';
import { downloadQuotePDF, previewQuotePDF } from '@/lib/pdf/download';
import { Quote } from '@/types/database';

interface QuoteBuilderModalProps {
  dealId?: string;
  initialProductId?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DraftItem {
  productId: string;
  quantity: number;
  manualPrice?: number;
  isManualPrice: boolean;
  manualReason?: string;
  discountPercent: number;
}

interface DraftCharge {
  ruleId: string;
  quantity: number;
  unitPrice: number;
  reason?: string;
}

export function QuoteBuilderModal({ dealId, initialProductId, isOpen, onClose }: QuoteBuilderModalProps) {
  const { deals, companies, contacts, products, priceTiers, surchargeRules, settings, addQuote } = useCRM();

  const currentDeal = deals.find(d => d.id === dealId);
  const company = companies.find(c => c.id === currentDeal?.company_id);
  const contact = contacts.find(c => c.id === currentDeal?.contact_id);

  const [title, setTitle] = useState(
    currentDeal ? `КП по сделке: ${currentDeal.title}` : 'Коммерческое предложение'
  );
  const [recipientName, setRecipientName] = useState(contact ? `${contact.first_name} ${contact.last_name || ''}` : '');
  const [recipientCompany, setRecipientCompany] = useState(company?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(contact?.phone || company?.phone || '');
  const [paymentTerms, setPaymentTerms] = useState('100% предоплата перед запуском в печать');
  const [productionTerms, setProductionTerms] = useState('10–14 рабочих дней после согласования макета');
  const [deliveryTerms, setDeliveryTerms] = useState('Доставка по г. Алматы включена в стоимость');

  // Список выбранных позиций
  const [draftItems, setDraftItems] = useState<DraftItem[]>([
    {
      productId: initialProductId || products[0]?.id || 'prod-1',
      quantity: 5000,
      isManualPrice: false,
      discountPercent: 0,
    }
  ]);

  // Доплаты (клише, цвета, усиление)
  const [draftCharges, setDraftCharges] = useState<DraftCharge[]>([
    {
      ruleId: surchargeRules[0]?.id || 'sur-1',
      quantity: 1,
      unitPrice: surchargeRules[0]?.default_price || 15000,
      reason: 'Клише под фирменный логотип',
    }
  ]);

  // Режим предпросмотра PDF-бланка
  const [previewMode, setPreviewMode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [quoteNumber] = useState(() => `КП-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);

  if (!isOpen) return null;

  // Расчет стоимости позиций
  const calculatedItems = draftItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    const tiers = priceTiers.filter(t => t.product_id === item.productId);
    
    // Автоматическое определение цены по тиражу
    const tierPrice = findTierPrice(item.quantity, tiers);
    const unitPrice = item.isManualPrice ? (item.manualPrice || 0) : (tierPrice || 0);
    
    const calc = calculateItemTotal({
      quantity: item.quantity,
      unitPrice,
      discountPercent: item.discountPercent,
    });

    return {
      item,
      product,
      tierPrice,
      unitPrice,
      ...calc,
    };
  });

  // Расчет доплат
  const calculatedCharges = draftCharges.map(charge => {
    const rule = surchargeRules.find(r => r.id === charge.ruleId);
    const totalCharge = calculateChargeTotal({
      chargeType: rule?.surcharge_type || 'one_time_fixed',
      unitPrice: charge.unitPrice,
      chargeQuantity: charge.quantity,
      itemQuantity: draftItems[0]?.quantity || 1,
    });

    return {
      charge,
      rule,
      totalCharge,
    };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const totalCharges = calculatedCharges.reduce((acc, c) => acc + c.totalCharge, 0);
  const grandTotal = roundCurrency(subtotal + totalCharges);

  const handleAddItem = () => {
    setDraftItems(prev => [
      ...prev,
      {
        productId: products[0]?.id || '',
        quantity: 1000,
        isManualPrice: false,
        discountPercent: 0,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCharge = () => {
    setDraftCharges(prev => [
      ...prev,
      {
        ruleId: surchargeRules[0]?.id || '',
        quantity: 1,
        unitPrice: surchargeRules[0]?.default_price || 0,
        reason: '',
      }
    ]);
  };

  const handleRemoveCharge = (index: number) => {
    setDraftCharges(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndFinalize = () => {
    // Проверка ручных цен без оснований по ТЗ п. 2 и 5.1
    for (const i of calculatedItems) {
      if (i.item.isManualPrice && !i.item.manualReason?.trim()) {
        alert(`Позиция "${i.product?.name}" имеет ручную цену. Укажите обязательное основание.`);
        return;
      }
      if (i.unitPrice <= 0) {
        alert(`Позиция "${i.product?.name}" не имеет цены для указанного тиража (${i.item.quantity} шт). Укажите ручную цену или измените тираж.`);
        return;
      }
    }

    const newQuoteItems: QuoteItem[] = calculatedItems.map((ci, idx) => ({
      id: `qi-${Date.now()}-${idx}`,
      quote_version_id: 'qv-temp',
      product_id: ci.product?.id,
      sku_snapshot: ci.product?.sku || 'UNKNOWN',
      name_snapshot: ci.product?.name || 'Товар',
      characteristics_snapshot: {
        'Объем': ci.product?.volume || '',
        'Диаметр': ci.product?.diameter || '',
        'Материал': ci.product?.material || '',
        'Слойность': ci.product?.layers || '',
      },
      unit_snapshot: ci.product?.unit || 'шт',
      image_url_snapshot: ci.product?.images?.[0]?.url || '',
      quantity: ci.item.quantity,
      base_unit_price: ci.unitPrice,
      discount_percent: ci.item.discountPercent,
      is_manual_price: ci.item.isManualPrice,
      manual_price_reason: ci.item.manualReason,
      item_subtotal: ci.subtotal,
      sort_order: idx + 1,
      created_at: new Date().toISOString(),
    }));

    const newQuoteCharges: QuoteCharge[] = calculatedCharges.map((cc, idx) => ({
      id: `qc-${Date.now()}-${idx}`,
      quote_version_id: 'qv-temp',
      quote_item_id: null,
      surcharge_rule_id: cc.rule?.id,
      name_snapshot: cc.rule?.name || 'Доплата',
      charge_type: cc.rule?.surcharge_type || 'one_time_fixed',
      quantity: cc.charge.quantity,
      unit_price: cc.charge.unitPrice,
      total_charge: cc.totalCharge,
      reason: cc.charge.reason,
      created_at: new Date().toISOString(),
    }));

    addQuote({
      quote_number: quoteNumber,
      deal_id: dealId || 'deal-1',
      title,
      recipient_name: recipientName || 'Клиент',
      recipient_company: recipientCompany,
      recipient_phone: recipientPhone,
      currency: 'KZT',
      status: 'ready',
      valid_until: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      payment_terms: paymentTerms,
      production_terms: productionTerms,
      delivery_terms: deliveryTerms,
      current_version: {
        id: `qv-${Date.now()}`,
        quote_id: `q-${Date.now()}`,
        version_number: 1,
        subtotal,
        total_discount: 0,
        total_surcharges: totalCharges,
        total_amount: grandTotal,
        is_finalized: true,
        finalized_at: new Date().toISOString(),
        notes: 'Финализировано и готово к отправке',
        created_at: new Date().toISOString(),
        items: newQuoteItems,
        charges: newQuoteCharges,
      }
    });

    alert(`КП ${quoteNumber} успешно сохранено на сумму ${formatCurrency(grandTotal)}! Сделка синхронизирована.`);
    onClose();
  };

  const constructCurrentQuote = (): Quote => {
    const newQuoteItems: QuoteItem[] = calculatedItems.map((ci, idx) => ({
      id: `item-${idx}`,
      quote_version_id: 'qv-temp',
      product_id: ci.product?.id,
      sku_snapshot: ci.product?.sku || 'UNKNOWN',
      name_snapshot: ci.product?.name || 'Товар',
      characteristics_snapshot: {
        'Объем': ci.product?.volume || '',
        'Диаметр': ci.product?.diameter || '',
        'Материал': ci.product?.material || '',
        'Слойность': ci.product?.layers || '',
      },
      unit_snapshot: ci.product?.unit || 'шт',
      image_url_snapshot: ci.product?.images?.[0]?.url || '',
      quantity: ci.item.quantity,
      base_unit_price: ci.unitPrice,
      discount_percent: ci.item.discountPercent,
      is_manual_price: ci.item.isManualPrice,
      manual_price_reason: ci.item.manualReason,
      item_subtotal: ci.subtotal,
      sort_order: idx + 1,
      created_at: new Date().toISOString(),
    }));

    const newQuoteCharges: QuoteCharge[] = calculatedCharges.map((cc, idx) => ({
      id: `qc-${idx}`,
      quote_version_id: 'qv-temp',
      quote_item_id: null,
      surcharge_rule_id: cc.rule?.id,
      name_snapshot: cc.rule?.name || 'Доплата',
      charge_type: cc.rule?.surcharge_type || 'one_time_fixed',
      quantity: cc.charge.quantity,
      unit_price: cc.charge.unitPrice,
      total_charge: cc.totalCharge,
      reason: cc.charge.reason,
      created_at: new Date().toISOString(),
    }));

    return {
      id: `q-preview-${Date.now()}`,
      quote_number: quoteNumber,
      deal_id: dealId || 'deal-1',
      title,
      recipient_name: recipientName || 'Клиент',
      recipient_company: recipientCompany,
      recipient_phone: recipientPhone,
      currency: 'KZT',
      status: 'ready',
      valid_until: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      payment_terms: paymentTerms,
      production_terms: productionTerms,
      delivery_terms: deliveryTerms,
      version: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_version: {
        id: `qv-preview-${Date.now()}`,
        quote_id: `q-preview-${Date.now()}`,
        version_number: 1,
        subtotal,
        total_discount: 0,
        total_surcharges: totalCharges,
        total_amount: grandTotal,
        is_finalized: false,
        created_at: new Date().toISOString(),
        items: newQuoteItems,
        charges: newQuoteCharges,
      },
    };
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const q = constructCurrentQuote();
      await downloadQuotePDF(q, settings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Попробуйте позже';
      alert(`Ошибка генерации PDF на сервере: ${msg}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const q = constructCurrentQuote();
      await previewQuotePDF(q, settings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Попробуйте позже';
      alert(`Ошибка предпросмотра PDF: ${msg}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: previewMode ? 860 : 800 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: 17, color: 'var(--text-main)' }}>
                {previewMode ? 'Предпросмотр КП (Бланк A4)' : 'Конструктор коммерческого предложения (КП)'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {currentDeal ? `Сделка: ${currentDeal.title}` : 'Расчет тиражей и стоимости'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Вернуться к редактору' : 'Печать / Предпросмотр'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {previewMode ? (
          /* КЛИЕНТСКИЙ БЛАНК PDF / A4 (ТЗ п. 5.4) */
          <div style={{
            background: '#FFFFFF',
            color: '#1E293B',
            padding: 32,
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            fontFamily: 'var(--font-sans)',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            {/* Шапка бланка */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, color: '#0F172A', fontWeight: 800 }}>{settings.company_name}</h2>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  <div>{settings.legal_name} | БИН: {settings.bin_iin}</div>
                  <div>{settings.address}</div>
                  <div>Тел: {settings.phone} | Email: {settings.email}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#D97706' }}>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Дата: {new Date().toLocaleDateString('ru-RU')}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Срок действия: 14 дней</div>
              </div>
            </div>

            {/* Получатель */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Заказчик: </span>
              <strong>{recipientCompany || 'Кофейня'}</strong>
              {recipientName && ` (Контакт: ${recipientName}, тел: ${recipientPhone})`}
            </div>

            {/* Таблица товаров с фото */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#F1F5F9', textAlign: 'left', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '8px 10px' }}>Фото</th>
                  <th style={{ padding: '8px 10px' }}>Товар и характеристики</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Тираж</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Цена за ед.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Скидка</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Сумма (KZT)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((ci, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 10px', width: 50 }}>
                      <img
                        src={ci.product?.images?.[0]?.url || 'https://via.placeholder.com/50'}
                        alt={ci.product?.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{ci.product?.name}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>
                        Арт: {ci.product?.sku} | {ci.product?.volume} {ci.product?.diameter} {ci.product?.material}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>
                      {ci.item.quantity.toLocaleString('ru-RU')} {ci.product?.unit}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {formatCurrency(ci.unitPrice)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {ci.item.discountPercent > 0 ? `${ci.item.discountPercent}%` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(ci.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Доплаты */}
            {calculatedCharges.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Дополнительные услуги и сборы:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {calculatedCharges.map((cc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed #E2E8F0' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <strong>{cc.rule?.name}</strong> {cc.charge.reason && `(${cc.charge.reason})`}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(cc.totalCharge)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Итого */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '16px 0',
              borderTop: '2px solid #0F172A',
              marginBottom: 20
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#64748B' }}>Стоимость товаров: {formatCurrency(subtotal)}</div>
                {totalCharges > 0 && (
                  <div style={{ fontSize: 12, color: '#64748B' }}>Сборы и услуги: {formatCurrency(totalCharges)}</div>
                )}
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                  ИТОГО К ОПЛАТЕ: {formatCurrency(grandTotal)}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Включая все применимые налоги и сборы</div>
              </div>
            </div>

            {/* Условия */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, fontSize: 11, color: '#475569' }}>
              <div><strong>Условия оплаты:</strong> {paymentTerms}</div>
              <div><strong>Сроки изготовления:</strong> {productionTerms}</div>
              <div><strong>Условия доставки:</strong> {deliveryTerms}</div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePreviewPDF}
                disabled={isGeneratingPDF}
              >
                <ExternalLink size={14} />
                <span>Открыть PDF</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                style={{ background: '#2563EB', borderColor: '#2563EB' }}
              >
                {isGeneratingPDF ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>
                  {isGeneratingPDF ? 'Генерация файла...' : 'Скачать официальный PDF на компьютер'}
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => window.print()}
                style={{ color: '#475569', borderColor: '#CBD5E1' }}
              >
                <Printer size={14} />
                <span>Печать</span>
              </button>
            </div>
          </div>
        ) : (
          /* РЕЖИМ РЕДАКТОРА И РАСЧЕТА */
          <div>
            {/* Секция позиций товаров */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, color: 'var(--text-main)' }}>1. Выбор упаковки и тиражей</h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddItem}
                >
                  <Plus size={14} />
                  <span>Добавить товар</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {calculatedItems.map((ci, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                      {/* Товар */}
                      <div>
                        <label className="label">Товар</label>
                        <select
                          className="select"
                          value={ci.item.productId}
                          onChange={(e) => {
                            const newProdId = e.target.value;
                            setDraftItems(prev => prev.map((item, i) => i === idx ? { ...item, productId: newProdId } : item));
                          }}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Тираж */}
                      <div>
                        <label className="label">Тираж (шт)</label>
                        <input
                          type="number"
                          step={500}
                          min={100}
                          className="input"
                          value={ci.item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDraftItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                          }}
                        />
                      </div>

                      {/* Автоматическая тиражная цена */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="label">Цена за ед.</label>
                          <label style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={ci.item.isManualPrice}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setDraftItems(prev => prev.map((item, i) => i === idx ? { ...item, isManualPrice: checked } : item));
                              }}
                              style={{ marginRight: 3 }}
                            />
                            Ручная
                          </label>
                        </div>
                        {ci.item.isManualPrice ? (
                          <input
                            type="number"
                            step={0.5}
                            placeholder="Своя цена"
                            className="input"
                            value={ci.item.manualPrice || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDraftItems(prev => prev.map((item, i) => i === idx ? { ...item, manualPrice: val } : item));
                            }}
                          />
                        ) : (
                          <div style={{
                            padding: '8px 12px',
                            background: '#FFFFFF',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            fontWeight: 700,
                            color: ci.tierPrice ? 'var(--primary)' : 'var(--rose-dark)',
                            border: '1px solid var(--border-medium)'
                          }}>
                            {ci.tierPrice ? `${ci.tierPrice} ₸` : 'Требуется расчет'}
                          </div>
                        )}
                      </div>

                      {/* Удаление позиции */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--rose-danger)',
                          cursor: 'pointer',
                          padding: 6,
                          marginTop: 18
                        }}
                        title="Удалить позицию"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Дополнительные параметры позиции: основание ручной цены и скидка */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
                      {ci.item.isManualPrice && (
                        <div>
                          <label className="label" style={{ color: 'var(--primary)' }}>Основание ручной цены *</label>
                          <input
                            type="text"
                            placeholder="Спец. договоренность / Акция"
                            className="input"
                            value={ci.item.manualReason || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftItems(prev => prev.map((item, i) => i === idx ? { ...item, manualReason: val } : item));
                            }}
                          />
                        </div>
                      )}

                      <div>
                        <label className="label">Скидка на позицию (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="input"
                          value={ci.item.discountPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDraftItems(prev => prev.map((item, i) => i === idx ? { ...item, discountPercent: val } : item));
                          }}
                        />
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Итого по позиции:</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--emerald-dark)' }}>
                          {formatCurrency(ci.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Секция доплат (клише, печать, усиление) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, color: 'var(--text-main)' }}>2. Доплаты и услуги (клише, печать, усиление)</h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddCharge}
                >
                  <Plus size={14} />
                  <span>Добавить сбор</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {calculatedCharges.map((cc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr auto',
                      gap: 12,
                      background: '#F8FAFC',
                      border: '1px solid var(--border-subtle)',
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      alignItems: 'center'
                    }}
                  >
                    <select
                      className="select"
                      value={cc.charge.ruleId}
                      onChange={(e) => {
                        const ruleId = e.target.value;
                        const rule = surchargeRules.find(r => r.id === ruleId);
                        setDraftCharges(prev => prev.map((c, i) => i === idx ? {
                          ...c,
                          ruleId,
                          unitPrice: rule?.default_price || 0
                        } : c));
                      }}
                    >
                      {surchargeRules.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Обоснование / примечание"
                      className="input"
                      value={cc.charge.reason || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraftCharges(prev => prev.map((c, i) => i === idx ? { ...c, reason: val } : c));
                      }}
                    />

                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      {formatCurrency(cc.totalCharge)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCharge(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--rose-danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Итоговая сводка и кнопка финализации */}
            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-main)' }}>
                  Товары: <strong>{formatCurrency(subtotal)}</strong> | Доплаты: <strong>{formatCurrency(totalCharges)}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  * При сохранении создается неизменяемый снимок цен v1 для фиксации в договоре.
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleSaveAndFinalize}>
                <CheckCircle2 size={16} />
                <span>Финализировать и сохранить КП</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
