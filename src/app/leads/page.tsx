'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { LeadModal } from '@/components/LeadModal';
import { Lead, LeadStatus } from '@/types/database';
import { Plus, Users2, MessageSquare, Phone, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LeadsPage() {
  const { leads, companies, contacts } = useCRM();

  const [activeFilter, setActiveFilter] = useState<'all' | LeadStatus>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredLeads = leads.filter(l => {
    if (activeFilter === 'all') return true;
    return l.status === activeFilter;
  });

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const handleCreateLead = () => {
    setSelectedLead(null);
    setModalOpen(true);
  };

  const getStatusBadge = (status: LeadStatus, junkReason?: string | null) => {
    switch (status) {
      case 'new':
        return <span className="badge badge-sky">Новый</span>;
      case 'in_progress':
        return <span className="badge badge-amber">В работе</span>;
      case 'qualified':
        return <span className="badge badge-emerald">Квалифицирован</span>;
      case 'junk':
        return (
          <span className="badge badge-rose" title={junkReason || 'Нецелевой'}>
            Нецелевой {junkReason && `(${junkReason})`}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header onQuickAction={() => handleCreateLead()} />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Лиды и обращения</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Поступающие запросы от кофеен, квалификация и конвертация в сделки
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleCreateLead}>
            <Plus size={15} />
            <span>Новый лид</span>
          </button>
        </div>

        {/* Фильтры по статусам (ТЗ п. 3.3) */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {[
            { id: 'all', label: 'Все обращения', count: leads.length },
            { id: 'new', label: 'Новые', count: leads.filter(l => l.status === 'new').length },
            { id: 'in_progress', label: 'В работе', count: leads.filter(l => l.status === 'in_progress').length },
            { id: 'qualified', label: 'Квалифицированы', count: leads.filter(l => l.status === 'qualified').length },
            { id: 'junk', label: 'Нецелевые', count: leads.filter(l => l.status === 'junk').length },
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: isActive ? 'var(--primary-light)' : '#FFFFFF',
                  borderColor: isActive ? 'var(--primary-border)' : 'var(--border-subtle)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: isActive ? 'var(--primary-border)' : '#F1F5F9',
                  color: isActive ? 'var(--primary-hover)' : 'var(--text-muted)',
                  padding: '1px 6px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Таблица лидов */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Имя контакта</th>
                <th>Компания / Проект</th>
                <th>Телефон и связь</th>
                <th>Интересующая продукция</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const normalized = lead.phone ? lead.phone.replace(/\D/g, '') : '';

                return (
                  <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => handleEditLead(lead)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lead.company_name || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--text-main)' }}>{lead.phone || '—'}</span>
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${normalized}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '2px 8px',
                              fontSize: 11,
                              color: 'var(--emerald-dark)',
                              borderColor: 'var(--emerald-border)',
                              background: 'var(--emerald-light)'
                            }}
                            title="Открыть WhatsApp (ТЗ п. 1)"
                          >
                            <MessageSquare size={12} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {lead.interested_products || '—'}
                      </span>
                    </td>
                    <td>{getStatusBadge(lead.status, lead.junk_reason)}</td>
                    <td suppressHydrationWarning style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      {lead.status !== 'qualified' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--emerald-border)', color: 'var(--emerald-dark)', background: 'var(--emerald-light)' }}
                          onClick={() => handleEditLead(lead)}
                        >
                          <ArrowRight size={13} />
                          <span>Конвертировать</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--emerald-dark)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <CheckCircle size={14} /> Сконвертирован
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    В данной категории нет лидов.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <LeadModal
          lead={selectedLead}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
