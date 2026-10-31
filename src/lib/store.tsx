'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Company, 
  Contact, 
  Lead, 
  Deal, 
  DealStage, 
  Pipeline,
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
  initialPipelines,
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
  pipelines: Pipeline[];
  activePipelineId: string;
  setActivePipelineId: (id: string) => void;
  stages: DealStage[];
  tasks: Task[];
  categories: Category[];
  products: Product[];
  priceLists: PriceList[];
  priceTiers: PriceTier[];
  surchargeRules: SurchargeRule[];
  quotes: Quote[];
  settings: CompanySettings;
  
  // Воронки продаж
  addPipeline: (data: { name: string; description?: string; is_default?: boolean; copyStagesFromPipelineId?: string }) => Pipeline;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void;
  deletePipeline: (id: string) => { success: boolean; error?: string };

  // Стадии / статусы воронки
  addStage: (stage: Omit<DealStage, 'id'>) => DealStage;
  updateStage: (id: string, updates: Partial<DealStage>) => void;
  deleteStage: (id: string, fallbackStageId?: string) => { success: boolean; error?: string };
  reorderStages: (pipelineId: string, orderedStageIds: string[]) => void;

  // Компании
  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  
  // Контакты
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;

  // Лиды
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'version' | 'is_archived'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  convertLead: (leadId: string, options: { createDeal: boolean; dealTitle?: string; existingCompanyId?: string; pipelineId?: string }) => { companyId: string; contactId: string; dealId?: string };

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

  // Каталог товаров и прайс-лист
  addProduct: (
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    tiers?: Omit<PriceTier, 'id' | 'price_list_id' | 'product_id'>[]
  ) => Product;
  updateProduct: (
    id: string,
    updates: Partial<Product>,
    tiers?: Omit<PriceTier, 'id' | 'price_list_id' | 'product_id'>[]
  ) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'sort_order'>) => Category;

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
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [activePipelineId, setActivePipelineId] = useState<string>('pipe-1');
  const [stages, setStages] = useState<DealStage[]>(initialDealStages);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [priceLists, setPriceLists] = useState<PriceList[]>(initialPriceLists);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(initialPriceTiers);
  const [surchargeRules, setSurchargeRules] = useState<SurchargeRule[]>(initialSurchargeRules);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [settings, setSettings] = useState<CompanySettings>(initialCompanySettings);

  // Загрузка из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companies) setCompanies(parsed.companies);
        if (parsed.contacts) setContacts(parsed.contacts);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.quotes) setQuotes(parsed.quotes);

        // Воронки (Pipelines)
        const loadedPipelines: Pipeline[] = (parsed.pipelines && Array.isArray(parsed.pipelines) && parsed.pipelines.length > 0)
          ? parsed.pipelines
          : initialPipelines;
        setPipelines(loadedPipelines);

        const defaultPipeId = loadedPipelines.find(p => p.is_default)?.id || loadedPipelines[0]?.id || 'pipe-1';
        if (parsed.activePipelineId && loadedPipelines.some(p => p.id === parsed.activePipelineId)) {
          setActivePipelineId(parsed.activePipelineId);
        } else {
          setActivePipelineId(defaultPipeId);
        }

        // Статусы / стадии (Stages)
        let loadedStages: DealStage[] = (parsed.stages && Array.isArray(parsed.stages) && parsed.stages.length > 0)
          ? parsed.stages
          : initialDealStages;

        // Миграция: убеждаемся, что у всех стадий есть pipeline_id
        loadedStages = loadedStages.map(s => {
          if (s.pipeline_id) return s;
          return { ...s, pipeline_id: defaultPipeId };
        });
        setStages(loadedStages);

        // Каталог и прайс
        if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          setCategories(parsed.categories);
        }
        if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
          setProducts(parsed.products);
        }
        if (parsed.priceTiers && Array.isArray(parsed.priceTiers) && parsed.priceTiers.length > 0) {
          setPriceTiers(parsed.priceTiers);
        }

        // Сделки (Deals) - привязка к воронке
        if (parsed.deals && Array.isArray(parsed.deals)) {
          const migratedDeals = parsed.deals.map((d: Deal) => {
            if (d.pipeline_id) return d;
            const dealStage = loadedStages.find(s => s.id === d.stage_id);
            return {
              ...d,
              pipeline_id: dealStage?.pipeline_id || defaultPipeId,
            };
          });
          setDeals(migratedDeals);
        }
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
        pipelines,
        stages,
        activePipelineId,
        tasks,
        quotes,
        categories,
        products,
        priceTiers,
      }));
    } catch (e) {
      console.warn('Could not save CRM local storage', e);
    }
  }, [mounted, companies, contacts, leads, deals, pipelines, stages, activePipelineId, tasks, quotes, categories, products, priceTiers]);

  // Воронки продаж (Pipelines)
  const addPipeline = (data: { name: string; description?: string; is_default?: boolean; copyStagesFromPipelineId?: string }): Pipeline => {
    const newId = `pipe-${Date.now()}`;
    const newPipeline: Pipeline = {
      id: newId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      is_default: Boolean(data.is_default),
      is_archived: false,
      sort_order: (pipelines.length + 1) * 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newPipeline.is_default) {
      setPipelines(prev => prev.map(p => ({ ...p, is_default: false })));
    }

    setPipelines(prev => [...prev, newPipeline]);

    // Создаем стадии для новой воронки
    let newStages: DealStage[] = [];
    if (data.copyStagesFromPipelineId) {
      const sourceStages = stages.filter(s => s.pipeline_id === data.copyStagesFromPipelineId);
      if (sourceStages.length > 0) {
        newStages = sourceStages.map((s, idx) => ({
          ...s,
          id: `stage-${Date.now()}-${idx}`,
          pipeline_id: newId,
        }));
      }
    }

    if (newStages.length === 0) {
      // Стандартный набор стадий по умолчанию
      newStages = [
        { id: `stage-${Date.now()}-1`, pipeline_id: newId, name: 'Новая', stage_order: 10, color: '#3B82F6', is_won: false, is_lost: false },
        { id: `stage-${Date.now()}-2`, pipeline_id: newId, name: 'Уточнение деталей', stage_order: 20, color: '#6366F1', is_won: false, is_lost: false },
        { id: `stage-${Date.now()}-3`, pipeline_id: newId, name: 'Подготовка КП', stage_order: 30, color: '#F59E0B', is_won: false, is_lost: false },
        { id: `stage-${Date.now()}-4`, pipeline_id: newId, name: 'Согласование условий', stage_order: 40, color: '#8B5CF6', is_won: false, is_lost: false },
        { id: `stage-${Date.now()}-5`, pipeline_id: newId, name: 'Успешно реализовано', stage_order: 50, color: '#10B981', is_won: true, is_lost: false },
        { id: `stage-${Date.now()}-6`, pipeline_id: newId, name: 'Закрыто и не реализовано', stage_order: 60, color: '#EF4444', is_won: false, is_lost: true },
      ];
    }

    setStages(prev => [...prev, ...newStages]);
    setActivePipelineId(newId);
    return newPipeline;
  };

  const updatePipeline = (id: string, updates: Partial<Pipeline>) => {
    setPipelines(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, ...updates, updated_at: new Date().toISOString() };
      }
      if (updates.is_default) {
        return { ...p, is_default: false };
      }
      return p;
    }));
  };

  const deletePipeline = (id: string): { success: boolean; error?: string } => {
    if (pipelines.length <= 1) {
      return { success: false, error: 'Нельзя удалить единственную воронку продаж.' };
    }
    const pipeDeals = deals.filter(d => d.pipeline_id === id);
    if (pipeDeals.length > 0) {
      return { success: false, error: `В этой воронке есть сделки (${pipeDeals.length} шт.). Перенесите или удалите их перед удалением воронки.` };
    }

    setPipelines(prev => prev.filter(p => p.id !== id));
    setStages(prev => prev.filter(s => s.pipeline_id !== id));

    if (activePipelineId === id) {
      const remaining = pipelines.filter(p => p.id !== id);
      setActivePipelineId(remaining[0]?.id || 'pipe-1');
    }
    return { success: true };
  };

  // Стадии / статусы воронки
  const addStage = (data: Omit<DealStage, 'id'>): DealStage => {
    const pipeStages = stages.filter(s => s.pipeline_id === data.pipeline_id);
    const maxOrder = pipeStages.reduce((max, s) => Math.max(max, s.stage_order), 0);
    const newStage: DealStage = {
      ...data,
      id: `stage-${Date.now()}`,
      stage_order: data.stage_order || (maxOrder + 10),
    };
    setStages(prev => [...prev, newStage]);
    return newStage;
  };

  const updateStage = (id: string, updates: Partial<DealStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStage = (id: string, fallbackStageId?: string): { success: boolean; error?: string } => {
    const targetStage = stages.find(s => s.id === id);
    if (!targetStage) return { success: false, error: 'Статус не найден.' };

    const pipeStages = stages.filter(s => s.pipeline_id === targetStage.pipeline_id);
    if (pipeStages.length <= 1) {
      return { success: false, error: 'В воронке должен оставаться хотя бы один статус.' };
    }

    const stageDeals = deals.filter(d => d.stage_id === id);
    if (stageDeals.length > 0) {
      if (!fallbackStageId) {
        return { 
          success: false, 
          error: `В этом статусе находится ${stageDeals.length} сделок. Выберите статус для их переноса.` 
        };
      }
      setDeals(prev => prev.map(d => d.stage_id === id ? { ...d, stage_id: fallbackStageId, updated_at: new Date().toISOString() } : d));
    }

    setStages(prev => prev.filter(s => s.id !== id));
    return { success: true };
  };

  const reorderStages = (pipelineId: string, orderedStageIds: string[]) => {
    setStages(prev => prev.map(s => {
      if (s.pipeline_id !== pipelineId) return s;
      const index = orderedStageIds.indexOf(s.id);
      if (index === -1) return s;
      return { ...s, stage_order: (index + 1) * 10 };
    }));
  };

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
    options: { createDeal: boolean; dealTitle?: string; existingCompanyId?: string; pipelineId?: string }
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
      const targetPipeId = options.pipelineId || activePipelineId || pipelines.find(p => p.is_default)?.id || pipelines[0]?.id;
      const targetStages = stages.filter(s => s.pipeline_id === targetPipeId).sort((a, b) => a.stage_order - b.stage_order);
      const firstStage = targetStages[0] || stages[0];

      const newDeal = addDeal({
        title: options.dealTitle || `Сделка: ${lead.company_name || lead.name}`,
        company_id: companyId,
        contact_id: newContact.id,
        pipeline_id: targetPipeId,
        stage_id: firstStage ? firstStage.id : stages[0]?.id,
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
    const stage = stages.find(s => s.id === data.stage_id);
    const pipelineId = data.pipeline_id || stage?.pipeline_id || activePipelineId || pipelines[0]?.id;
    const newDeal: Deal = {
      ...data,
      pipeline_id: pipelineId,
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
    const stage = stages.find(s => s.id === stageId);
    setDeals(prev => prev.map(d => {
      if (d.id !== dealId) return d;
      return {
        ...d,
        stage_id: stageId,
        pipeline_id: stage?.pipeline_id || d.pipeline_id,
        loss_reason: lossReason || d.loss_reason,
        updated_at: new Date().toISOString(),
      };
    }));
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== id) return d;
      let pipelineId = updates.pipeline_id || d.pipeline_id;
      if (updates.stage_id && !updates.pipeline_id) {
        const stage = stages.find(s => s.id === updates.stage_id);
        if (stage?.pipeline_id) pipelineId = stage.pipeline_id;
      }
      return { ...d, ...updates, pipeline_id: pipelineId, updated_at: new Date().toISOString() };
    }));
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

  const addCategory = (data: Omit<Category, 'id' | 'sort_order'>): Category => {
    const newCategory: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      sort_order: (categories.length + 1) * 10,
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const addProduct = (
    data: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    tiers?: Omit<PriceTier, 'id' | 'price_list_id' | 'product_id'>[]
  ): Product => {
    const productId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...data,
      id: productId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);

    if (tiers && tiers.length > 0) {
      const newTiers: PriceTier[] = tiers.map((t, idx) => ({
        ...t,
        id: `tier-${Date.now()}-${idx}`,
        price_list_id: priceLists[0]?.id || 'pl-1',
        product_id: productId,
      }));
      setPriceTiers(prev => [...prev, ...newTiers]);
    }

    return newProduct;
  };

  const updateProduct = (
    id: string,
    updates: Partial<Product>,
    tiers?: Omit<PriceTier, 'id' | 'price_list_id' | 'product_id'>[]
  ) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));

    if (tiers !== undefined) {
      setPriceTiers(prev => {
        const otherTiers = prev.filter(t => t.product_id !== id);
        const updatedTiers: PriceTier[] = tiers.map((t, idx) => ({
          ...t,
          id: `tier-${Date.now()}-${idx}`,
          price_list_id: priceLists[0]?.id || 'pl-1',
          product_id: id,
        }));
        return [...otherTiers, ...updatedTiers];
      });
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setPriceTiers(prev => prev.filter(t => t.product_id !== id));
  };

  const resetToDefault = () => {
    setCompanies(initialCompanies);
    setContacts(initialContacts);
    setLeads(initialLeads);
    setDeals(initialDeals);
    setPipelines(initialPipelines);
    setActivePipelineId('pipe-1');
    setStages(initialDealStages);
    setTasks(initialTasks);
    setQuotes(initialQuotes);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setPriceTiers(initialPriceTiers);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CRMContext.Provider
      value={{
        companies,
        contacts,
        leads,
        deals,
        pipelines,
        activePipelineId,
        setActivePipelineId,
        stages,
        tasks,
        categories,
        products,
        priceLists,
        priceTiers,
        surchargeRules,
        quotes,
        settings,
        addPipeline,
        updatePipeline,
        deletePipeline,
        addStage,
        updateStage,
        deleteStage,
        reorderStages,
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
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
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
