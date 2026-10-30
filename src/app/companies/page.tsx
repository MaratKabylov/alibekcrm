'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { CompanyModal } from '@/components/CompanyModal';
import { Company } from '@/types/database';
import { Plus, Building2, MapPin, Phone, Mail, Tag } from 'lucide-react';

export default function CompaniesPage() {
  const { companies, contacts, deals } = useCRM();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setModalOpen(true);
  };

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setModalOpen(true);
  };

  return (
    <>
      <Header onQuickAction={() => handleCreateCompany()} />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Компании и клиенты</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Кофейни, сети, пиццерии, адреса доставки и реквизиты (БИН/ИИН)
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleCreateCompany}>
            <Plus size={16} />
            <span>Новая компания</span>
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Компания</th>
                <th>Тип клиента</th>
                <th>БИН / ИИН</th>
                <th>Контакты</th>
                <th>Адреса точек / складов</th>
                <th>Теги</th>
                <th>Сделки</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => {
                const companyContacts = contacts.filter(c => c.company_id === company.id);
                const companyDeals = deals.filter(d => d.company_id === company.id);

                return (
                  <tr key={company.id} style={{ cursor: 'pointer' }} onClick={() => handleEditCompany(company)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'rgba(245, 158, 11, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#F59E0B'
                        }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#FFF' }}>{company.name}</div>
                          {company.website && (
                            <div style={{ fontSize: 11, color: '#64748B' }}>{company.website}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-amber">{company.client_type}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#CBD5E1' }}>
                      {company.bin_iin || '—'}
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        {company.phone && <div>{company.phone}</div>}
                        <div style={{ color: '#94A3B8', fontSize: 11 }}>
                          {companyContacts.length} контактных лиц
                        </div>
                      </div>
                    </td>
                    <td>
                      {company.delivery_addresses && company.delivery_addresses.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                          <MapPin size={13} color="#F59E0B" />
                          <span>{company.delivery_addresses[0]}</span>
                          {company.delivery_addresses.length > 1 && (
                            <span className="badge badge-sky" style={{ fontSize: 10, padding: '1px 5px' }}>
                              +{company.delivery_addresses.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: 12 }}>Не указан</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {company.tags?.map(t => (
                          <span key={t} className="badge badge-indigo" style={{ fontSize: 10, padding: '2px 6px' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#FCD34D' }}>
                      {companyDeals.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <CompanyModal
          company={selectedCompany}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
