'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, 
  Contact, 
  Lead, 
  Deal, 
  DealStage, 
  Task, 
  Product, 
  Category, 
  PriceList, 
  PriceTier, 
  SurchargeRule,
  Quote,
  CompanySettings
} from '@/types/database';

import {
  initialCompanies,
  initialContacts,
  initialLeads,
  initialDealStages,
  initialDeals,
  initialTasks,
  initialCategories,
  initialProducts,
  initialPriceLists,
  initialPriceTiers,
  initialSurchargeRules,
  initialQuotes,
  initialCompanySettings,
} from './supabase/mock-data';

interface CRMContextType {
  // Данные
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  stages: DealStage[];
  tasks: Task[];
  categories: Category[];
  products: Product[];
  priceLists: PriceList[];
  priceTiers: PriceTier[];
  surchargeRules: SurchargeRule[];
  quotes: Quote[];
  settings: CompanySettings;
  
  // Компании
  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  
  // Контакты
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;

  // Лиды
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  convertLead: (leadId: string, options: { createDeal: boolean; dealTitle?: string; existingCompanyId?: string }) => { companyId: string; contactId: string; dealId?: string };

  // Сделки
  addDeal: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Deal;
  updateDealStage: (dealId: string, stageId: string, lossReason?: string) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;

  // Задачи
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Task;
  toggleTaskStatus: (taskId: string) => void;

  // Коммерческие предложения (КП)
  addQuote: (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;

  // Сброс к демо
  resetToDefault: () => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

const STORAGE_KEY = 'alibek_crm_state_v1';

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [stages] = useState<DealStage[]>(initialDealStages);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [categories] = useState<Category[]>(initialCategories);
  const [products] = useState<Product[]>(initialProducts);
  const [priceLists] = useState<PriceList[]>(initialPriceLists);
  const [priceTiers] = useState<PriceTier[]>(initialPriceTiers);
  const [surchargeRules] = useState<SurchargeRule[]>(initialSurchargeRules);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [settings] = useState<CompanySettings>(initialCompanySettings);

  // Загрузка из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companies) setCompanies(parsed.companies);
        if (parsed.contacts) setContacts(parsed.contacts);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.deals) setDeals(parsed.deals);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.quotes) setQuotes(parsed.quotes);
      }
    } catch (e) {
      console.warn('Could not load CRM local storage', e);
    }
    setMounted(true);
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        companies,
        contacts,
        leads,
        deals,
        tasks,
        quotes,
      }));
    } catch (e) {
      console.warn('Could not save CRM local storage', e);
    }
  }, [mounted, companies, contacts, leads, deals, tasks, quotes]);

  const addCompany = (data: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>): Company => {
    const newCompany: Company = {
      ...data,
      id: `comp-${Date.now()}`,
      version: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCompanies(prev => [newCompany, ...prev]);
    return newCompany;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
  };

  const addContact = (data: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>): Contact => {
    const newContact: Contact = {
      ...data,
      id: `cont-${Date.now()}`,
      version: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setContacts(prev => [newContact, ...prev]);
    return newContact;
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
  };

  const addLead = (data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>): Lead => {
    const newLead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      version: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLeads(prev => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l));
  };

  const convertLead = (
    leadId: string, 
    options: { createDeal: boolean; dealTitle?: string; existingCompanyId?: string }
  ) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Лид не найден');

    let companyId = options.existingCompanyId;

    // 1. Создаем компанию, если не выбрана существующая
    if (!companyId) {
      const newComp = addCompany({
        name: lead.company_name || lead.name,
        client_type: 'кофейня',
        phone: lead.phone,
        email: lead.email,
        tags: ['из лида'],
        notes: `Сконвертирован из лида: ${lead.name}. Интерес: ${lead.interested_products || 'не указан'}`,
      });
      companyId = newComp.id;
    }

    // 2. Создаем контакт
    const newContact = addContact({
      company_id: companyId,
      first_name: lead.name,
      phone: lead.phone || '',
      phone_normalized: lead.phone_normalized || (lead.phone ? lead.phone.replace(/\D/g, '') : ''),
      email: lead.email,
      preferred_channel: 'whatsapp',
      notes: 'Создан при конвертации лида',
    });

    let dealId: string | undefined;

    // 3. Создаем сделку при необходимости
    if (options.createDeal) {
      const newDeal = addDeal({
        title: options.dealTitle || `Сделка: ${lead.company_name || lead.name}`,
        company_id: companyId,
        contact_id: newContact.id,
        stage_id: stages[0].id, // Новая
        amount: 0,
        currency: 'KZT',
        notes: `Сконвертировано из лида. Запрос: ${lead.interested_products || ''}`,
      });
      dealId = newDeal.id;
    }

    // 4. Обновляем статус лида на "qualified"
    updateLead(leadId, {
      status: 'qualified',
      converted_company_id: companyId,
      converted_contact_id: newContact.id,
      converted_deal_id: dealId,
      converted_at: new Date().toISOString(),
    });

    return { companyId, contactId: newContact.id, dealId };
  };

  const addDeal = (data: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>): Deal => {
    const newDeal: Deal = {
      ...data,
      id: `deal-${Date.now()}`,
      version: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDeals(prev => [newDeal, ...prev]);
    return newDeal;
  };

  const updateDealStage = (dealId: string, stageId: string, lossReason?: string) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== dealId) return d;
      return {
        ...d,
        stage_id: stageId,
        loss_reason: lossReason || d.loss_reason,
        updated_at: new Date().toISOString(),
      };
    }));
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d));
  };

  const addTask = (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: t.status === 'completed' ? 'pending' : 'completed',
        updated_at: new Date().toISOString(),
      };
    }));
  };

  const addQuote = (data: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>): Quote => {
    const newQuote: Quote = {
      ...data,
      id: `quote-${Date.now()}`,
      version: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setQuotes(prev => [newQuote, ...prev]);

    // Обновляем сумму в сделке
    if (newQuote.deal_id && newQuote.current_version?.total_amount) {
      updateDeal(newQuote.deal_id, {
        amount: newQuote.current_version.total_amount,
      });
    }

    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => {
      if (q.id !== id) return q;
      const updated = { ...q, ...updates, updated_at: new Date().toISOString() };
      if (updated.deal_id && updated.current_version?.total_amount) {
        updateDeal(updated.deal_id, { amount: updated.current_version.total_amount });
      }
      return updated;
    }));
  };

  const resetToDefault = () => {
    setCompanies(initialCompanies);
    setContacts(initialContacts);
    setLeads(initialLeads);
    setDeals(initialDeals);
    setTasks(initialTasks);
    setQuotes(initialQuotes);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CRMContext.Provider
      value={{
        companies,
        contacts,
        leads,
        deals,
        stages,
        tasks,
        categories,
        products,
        priceLists,
        priceTiers,
        surchargeRules,
        quotes,
        settings,
        addCompany,
        updateCompany,
        addContact,
        updateContact,
        addLead,
        updateLead,
        convertLead,
        addDeal,
        updateDealStage,
        updateDeal,
        addTask,
        toggleTaskStatus,
        addQuote,
        updateQuote,
        resetToDefault,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
