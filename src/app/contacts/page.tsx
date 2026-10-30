'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { Contact } from '@/types/database';
import { Building2, MessageSquare } from 'lucide-react';

export default function ContactsPage() {
  const { contacts, companies } = useCRM();

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Контакты и представители</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Бариста, управляющие, директора по закупкам и лица, принимающие решения
            </p>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Имя представителя</th>
                <th>Должность</th>
                <th>Компания</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Канал связи</th>
                <th style={{ textAlign: 'right' }}>Связь</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => {
                const company = companies.find(c => c.id === contact.company_id);
                const normalized = contact.phone_normalized || contact.phone.replace(/\D/g, '');

                return (
                  <tr key={contact.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: 13
                        }}>
                          {contact.first_name[0]}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {contact.first_name} {contact.last_name || ''}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{contact.position || '—'}</td>
                    <td>
                      {company ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)' }}>
                          <Building2 size={13} color="var(--primary)" />
                          <span>{company.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Без компании</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-main)' }}>
                      {contact.phone}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{contact.email || '—'}</td>
                    <td>
                      <span className="badge badge-emerald">
                        {contact.preferred_channel.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={`https://wa.me/${normalized}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '3px 8px',
                          fontSize: 11,
                          color: 'var(--emerald-dark)',
                          borderColor: 'var(--emerald-border)',
                          background: 'var(--emerald-light)'
                        }}
                      >
                        <MessageSquare size={12} />
                        <span>WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
