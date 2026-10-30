'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { Quote, QuoteStatus } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { Plus, FileText, Printer, Building2, Calendar, CheckCircle2, Clock, Send, X } from 'lucide-react';

export default function QuotesPage() {
  const { quotes, deals, updateQuote, settings } = useCRM();

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-sky">Черновик</span>;
      case 'ready':
        return <span className="badge badge-amber">Готово к отправке</span>;
      case 'sent':
        return <span className="badge badge-indigo">Отправлено клиенту</span>;
      case 'accepted':
        return <span className="badge badge-emerald">Принято заказчиком</span>;
      case 'rejected':
        return <span className="badge badge-rose">Отклонено</span>;
      case 'expired':
        return <span className="badge" style={{ background: '#F1F5F9', color: 'var(--text-muted)' }}>Истекло</span>;
      default:
        return null;
    }
  };

  const handleMarkSent = (quote: Quote) => {
    updateQuote(quote.id, { status: 'sent' });
    alert(`Статус КП ${quote.quote_number} изменён на "Отправлено клиенту"!`);
  };

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Коммерческие предложения (КП)</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Версионирование, слепки цен и формирование официальных PDF-бланков
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setQuoteModalOpen(true)}>
            <Plus size={15} />
            <span>Новое КП</span>
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Номер КП и версия</th>
                <th>Сделка</th>
                <th>Получатель / Заказчик</th>
                <th>Статус</th>
                <th>Срок действия</th>
                <th>Сумма (KZT)</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => {
                const deal = deals.find(d => d.id === quote.deal_id);
                const version = quote.current_version;

                return (
                  <tr key={quote.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="var(--primary)" />
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>{quote.quote_number}</strong>
                          <span style={{
                            marginLeft: 6,
                            fontSize: 11,
                            background: '#F1F5F9',
                            padding: '1px 5px',
                            borderRadius: 4,
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            v{version?.version_number || 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {deal ? deal.title : '—'}
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{quote.recipient_company || quote.recipient_name}</strong>
                        {quote.recipient_company && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{quote.recipient_name}</div>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(quote.status)}</td>
                    <td suppressHydrationWarning style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      До {new Date(quote.valid_until).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {formatCurrency(version?.total_amount || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {quote.status !== 'sent' && quote.status !== 'accepted' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--primary)' }}
                            onClick={() => handleMarkSent(quote)}
                            title="Отметить как отправленное"
                          >
                            <Send size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
                          onClick={() => setPreviewQuote(quote)}
                        >
                          <Printer size={13} />
                          <span>Бланк КП</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка просмотра и печати КП (PDF A4) */}
      {previewQuote && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 860 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17, color: 'var(--text-main)' }}>
                {previewQuote.quote_number} (Версия {previewQuote.current_version?.version_number || 1})
              </h3>
              <button 
                onClick={() => setPreviewQuote(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={18} />
                <span>Закрыть</span>
              </button>
            </div>

            <div style={{
              background: '#FFFFFF',
              color: '#0F172A',
              padding: 28,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-sans)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              {/* Шапка бланка */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, color: '#0F172A', fontWeight: 800 }}>{settings.company_name}</h2>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    <div>{settings.legal_name} | БИН: {settings.bin_iin}</div>
                    <div>{settings.address}</div>
                    <div>Тел: {settings.phone} | Email: {settings.email}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{previewQuote.quote_number}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Дата: {new Date(previewQuote.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>

              {/* Получатель */}
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 12, border: '1px solid #E2E8F0' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Заказчик: </span>
                <strong>{previewQuote.recipient_company || previewQuote.recipient_name}</strong>
                {previewQuote.recipient_phone && ` (Телефон: ${previewQuote.recipient_phone})`}
              </div>

              {/* Таблица снимка позиций */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', textAlign: 'left', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: '8px 10px' }}>Артикул</th>
                    <th style={{ padding: '8px 10px' }}>Наименование и характеристики (Снимок)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Количество</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Цена за ед.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Скидка</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Сумма (KZT)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQuote.current_version?.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{item.sku_snapshot}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <strong>{item.name_snapshot}</strong>
                        <div style={{ fontSize: 10, color: '#64748B' }}>
                          {Object.entries(item.characteristics_snapshot || {}).map(([k, v]) => v ? `${k}: ${v}` : '').filter(Boolean).join(' | ')}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity.toLocaleString('ru-RU')} {item.unit_snapshot}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(item.base_unit_price)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.item_subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Доплаты */}
              {previewQuote.current_version?.charges && previewQuote.current_version.charges.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Дополнительные услуги и сборы:
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <tbody>
                      {previewQuote.current_version.charges.map((charge, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '4px 8px' }}>{charge.name_snapshot}</td>
                          <td style={{ padding: '4px 8px', color: '#64748B' }}>{charge.reason || 'Фиксированный сбор'}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(charge.total_charge)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Итоги */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{ width: 280, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Сумма по товарам: {formatCurrency(previewQuote.current_version?.subtotal || 0)}
                  </div>
                  {previewQuote.current_version?.total_surcharges ? (
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      Сборы и услуги: {formatCurrency(previewQuote.current_version.total_surcharges)}
                    </div>
                  ) : null}
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                    ИТОГО: {formatCurrency(previewQuote.current_version?.total_amount || 0)}
                  </div>
                </div>
              </div>

              {/* Условия */}
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, fontSize: 11, color: '#475569', border: '1px solid #E2E8F0' }}>
                <div><strong>Условия оплаты:</strong> {previewQuote.payment_terms}</div>
                <div><strong>Сроки изготовления:</strong> {previewQuote.production_terms}</div>
                <div><strong>Условия доставки:</strong> {previewQuote.delivery_terms}</div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Печать в PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {quoteModalOpen && (
        <QuoteBuilderModal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
        />
      )}
    </>
  );
}
