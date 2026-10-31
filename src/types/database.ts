export type UserRole = 'admin' | 'manager';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  client_type: string;
  bin_iin?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  delivery_addresses?: string[] | null;
  assigned_to?: string | null;
  parent_company_id?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyAddress {
  id: string;
  company_id: string;
  title: string;
  address_line: string;
  city: string;
  postal_code?: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id?: string | null;
  first_name: string;
  last_name?: string | null;
  position?: string | null;
  phone: string;
  phone_normalized: string;
  email?: string | null;
  preferred_channel: 'whatsapp' | 'phone' | 'email' | 'telegram';
  assigned_to?: string | null;
  notes?: string | null;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LeadSource {
  id: string;
  name: string;
  is_active: boolean;
}

export type LeadStatus = 'new' | 'in_progress' | 'qualified' | 'junk';

export interface Lead {
  id: string;
  name: string;
  company_name?: string | null;
  phone?: string | null;
  phone_normalized?: string | null;
  email?: string | null;
  source_id?: string | null;
  interested_products?: string | null;
  status: LeadStatus;
  junk_reason?: string | null;
  assigned_to?: string | null;
  next_contact_date?: string | null;
  notes?: string | null;
  converted_company_id?: string | null;
  converted_contact_id?: string | null;
  converted_deal_id?: string | null;
  converted_at?: string | null;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_archived?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
}

export interface DealStage {
  id: string;
  pipeline_id?: string;
  name: string;
  stage_order: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
}

export interface Deal {
  id: string;
  title: string;
  company_id: string;
  contact_id?: string | null;
  assigned_to?: string | null;
  pipeline_id?: string | null;
  stage_id: string;
  expected_close_date?: string | null;
  amount: number;
  currency: string;
  source_id?: string | null;
  loss_reason?: string | null;
  notes?: string | null;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  // Joins
  company?: Company;
  contact?: Contact;
  stage?: DealStage;
  pipeline?: Pipeline;
}

export type TaskType = 'call' | 'message' | 'meeting' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  task_type: TaskType;
  due_date: string;
  status: TaskStatus;
  assigned_to?: string | null;
  lead_id?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  sort_order: number;
}

export interface ProductImage {
  url: string;
  is_primary?: boolean;
  alt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id?: string | null;
  description?: string | null;
  material?: string | null;
  volume?: string | null;
  dimensions?: string | null;
  diameter?: string | null;
  layers?: string | null;
  color?: string | null;
  unit: string;
  pack_quantity: number;
  min_order_quantity: number;
  order_step: number;
  is_active: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
  // Relation helpers
  category?: Category;
  tiers?: PriceTier[];
}

export interface PriceList {
  id: string;
  name: string;
  currency: string;
  status: 'draft' | 'active' | 'archived';
  valid_from: string;
  published_at?: string | null;
  published_by?: string | null;
  created_at: string;
}

export interface PriceTier {
  id: string;
  price_list_id: string;
  product_id: string;
  min_quantity: number;
  max_quantity?: number | null;
  unit_price: number;
  notes?: string | null;
}

export type SurchargeType = 'per_unit' | 'per_color_unit' | 'one_time_fixed' | 'custom_manual';

export interface SurchargeRule {
  id: string;
  name: string;
  surcharge_type: SurchargeType;
  description?: string | null;
  default_price: number;
  scope: 'all' | 'category' | 'product';
  category_id?: string | null;
  product_id?: string | null;
  is_active: boolean;
}

export type QuoteStatus = 'draft' | 'ready' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Quote {
  id: string;
  quote_number: string;
  deal_id: string;
  title: string;
  recipient_name: string;
  recipient_company?: string | null;
  recipient_phone?: string | null;
  recipient_email?: string | null;
  currency: string;
  status: QuoteStatus;
  valid_until: string;
  payment_terms?: string | null;
  production_terms?: string | null;
  delivery_terms?: string | null;
  author_id?: string | null;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  // Joins
  current_version?: QuoteVersion;
}

export interface QuoteVersion {
  id: string;
  quote_id: string;
  version_number: number;
  subtotal: number;
  total_discount: number;
  total_surcharges: number;
  total_amount: number;
  price_list_id?: string | null;
  pdf_path?: string | null;
  is_finalized: boolean;
  finalized_at?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  // Joins
  items?: QuoteItem[];
  charges?: QuoteCharge[];
}

export interface QuoteItem {
  id: string;
  quote_version_id: string;
  product_id?: string | null;
  sku_snapshot: string;
  name_snapshot: string;
  characteristics_snapshot: Record<string, string | number | boolean>;
  unit_snapshot: string;
  image_url_snapshot?: string | null;
  quantity: number;
  base_unit_price: number;
  discount_percent: number;
  is_manual_price: boolean;
  manual_price_reason?: string | null;
  item_subtotal: number;
  sort_order: number;
  created_at: string;
}

export interface QuoteCharge {
  id: string;
  quote_version_id: string;
  quote_item_id?: string | null;
  surcharge_rule_id?: string | null;
  name_snapshot: string;
  charge_type: SurchargeType;
  quantity: number;
  unit_price: number;
  total_charge: number;
  reason?: string | null;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  legal_name?: string | null;
  bin_iin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_details?: string | null;
  logo_url?: string | null;
  default_currency: string;
  default_quote_validity_days: number;
  created_at: string;
  updated_at: string;
}
