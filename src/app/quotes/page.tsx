'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { QuoteBuilderModal } from '@/components/QuoteBuilderModal';
import { Quote, QuoteStatus } from '@/types/database';
import { formatCurrency } from '@/lib/calculator';
import { Plus, FileText, Printer, Building2, Calendar, CheckCircle2, Clock, Send } from 'lucide-react';

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
        return <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: '#94A3B8' }}>Истекло</span>;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Коммерческие предложения (КП)</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Версионирование, слепки цен и формирование официальных PDF-бланков
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setQuoteModalOpen(true)}>
            <Plus size={16} />
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
                        <FileText size={16} color="#F59E0B" />
                        <div>
                          <strong style={{ color: '#FFF' }}>{quote.quote_number}</strong>
                          <span style={{
                            marginLeft: 6,
                            fontSize: 11,
                            background: 'rgba(255,255,255,0.08)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            color: '#FCD34D'
                          }}>
                            v{version?.version_number || 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#CBD5E1' }}>
                      {deal ? deal.title : '—'}
                    </td>
                    <td>
                      <div>
                        <strong>{quote.recipient_company || quote.recipient_name}</strong>
                        {quote.recipient_company && (
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{quote.recipient_name}</div>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(quote.status)}</td>
                    <td suppressHydrationWarning style={{ fontSize: 12, color: '#94A3B8' }}>
                      До {new Date(quote.valid_until).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ fontWeight: 800, color: '#F59E0B' }}>
                      {formatCurrency(version?.total_amount || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {quote.status !== 'sent' && quote.status !== 'accepted' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#818CF8' }}
                            onClick={() => handleMarkSent(quote)}
                            title="Отметить как отправленное"
                          >
                            <Send size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#FCD34D', borderColor: 'rgba(245, 158, 11, 0.3)' }}
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
              <h3 style={{ fontSize: 18, color: '#FFF' }}>
                {previewQuote.quote_number} (Версия {previewQuote.current_version?.version_number || 1})
              </h3>
              <button onClick={() => setPreviewQuote(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <Printer size={18} style={{ marginRight: 12 }} onClick={() => window.print()} />
                Закрыть
              </button>
            </div>

            <div style={{
              background: '#FFFFFF',
              color: '#0F172A',
              padding: 32,
              borderRadius: 8,
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
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{previewQuote.quote_number}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Дата: {new Date(previewQuote.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>

              {/* Получатель */}
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 12 }}>
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
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Цена за шт.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQuote.current_version?.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{item.sku_snapshot}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700 }}>{item.name_snapshot}</div>
                        <div style={{ fontSize: 10, color: '#64748B' }}>
                          {Object.entries(item.characteristics_snapshot || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>
                        {item.quantity.toLocaleString('ru-RU')} {item.unit_snapshot}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {formatCurrency(item.base_unit_price)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(item.item_subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Сборы */}
              {previewQuote.current_version?.charges && previewQuote.current_version.charges.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Дополнительные сборы:</div>
                  {previewQuote.current_version.charges.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span>{c.name_snapshot} {c.reason && `(${c.reason})`}</span>
                      <strong>{formatCurrency(c.total_charge)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Итог */}
              <div style={{ textAlign: 'right', borderTop: '2px solid #0F172A', paddingTop: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  ИТОГО: {formatCurrency(previewQuote.current_version?.total_amount || 0)}
                </div>
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
