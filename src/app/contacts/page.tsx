'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Header } from '@/components/Header';
import { Contact } from '@/types/database';
import { Plus, User, Building2, Phone, MessageSquare, Mail } from 'lucide-react';

export default function ContactsPage() {
  const { contacts, companies } = useCRM();

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Контакты и представители</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
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
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#F59E0B',
                          fontWeight: 700,
                          fontSize: 13
                        }}>
                          {contact.first_name[0]}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {contact.first_name} {contact.last_name || ''}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#94A3B8' }}>{contact.position || '—'}</td>
                    <td>
                      {company ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={13} color="#F59E0B" />
                          <span>{company.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748B' }}>Без компании</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{contact.phone}</td>
                    <td style={{ color: '#94A3B8' }}>{contact.email || '—'}</td>
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
                          color: '#6EE7B7',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          background: 'rgba(16, 185, 129, 0.08)'
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
