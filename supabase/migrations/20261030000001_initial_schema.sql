-- ============================================================================
-- CRM для продажи упаковки кофейням (Alibek CRM)
-- Начальная схема базы данных согласно ТЗ v1.0 от 30.10.2026
-- ============================================================================

-- Включаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Пользователи и профили
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'manager');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'manager',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. Компании и адреса доставки
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client_type TEXT DEFAULT 'кофейня', -- кофейня, сеть, дистрибьютор, пекарня и т.д.
    bin_iin VARCHAR(12), -- БИН/ИИН для Казахстана (12 цифр)
    phone TEXT,
    email TEXT,
    website TEXT,
    delivery_addresses TEXT[], -- список основных адресов
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- для филиалов
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS company_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Основной склад/кофейня',
    address_line TEXT NOT NULL,
    city TEXT DEFAULT 'Алматы',
    postal_code TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 3. Контакты
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT DEFAULT '',
    position TEXT, -- например: «Бариста», «Управляющий», «Владелец»
    phone TEXT NOT NULL,
    phone_normalized TEXT NOT NULL, -- нормализованный телефон без знаков для поиска дублей (+77...)
    email TEXT,
    preferred_channel TEXT DEFAULT 'whatsapp', -- whatsapp, phone, email, telegram
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 4. Лиды и источники
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO lead_sources (name) VALUES 
('Instagram'), ('WhatsApp прямой'), ('Рекомендация'), ('Холодный звонок'), ('Сайт / Выставка')
ON CONFLICT (name) DO NOTHING;

CREATE TYPE lead_status AS ENUM ('new', 'in_progress', 'qualified', 'junk');

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- имя контакта или компании
    company_name TEXT,
    phone TEXT,
    phone_normalized TEXT,
    email TEXT,
    source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
    interested_products TEXT,
    status lead_status NOT NULL DEFAULT 'new',
    junk_reason TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    next_contact_date TIMESTAMPTZ,
    notes TEXT,
    converted_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    converted_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    converted_deal_id UUID, -- будет связан со сделкой
    converted_at TIMESTAMPTZ,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 5. Стадии и Сделки
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stage_order INT NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#4F46E5',
    is_won BOOLEAN NOT NULL DEFAULT false,
    is_lost BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO deal_stages (name, stage_order, color, is_won, is_lost) VALUES
('Новая', 10, '#3B82F6', false, false),
('Уточнение потребности', 20, '#6366F1', false, false),
('Подготовка КП', 30, '#F59E0B', false, false),
('КП отправлено', 40, '#8B5CF6', false, false),
('Согласование', 50, '#EC4899', false, false),
('Выиграна', 60, '#10B981', true, false),
('Проиграна', 70, '#EF4444', false, true)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    stage_id UUID NOT NULL REFERENCES deal_stages(id) ON DELETE RESTRICT,
    expected_close_date DATE,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
    source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
    loss_reason TEXT,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Добавляем внешний ключ из leads на deals
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_converted_deal 
FOREIGN KEY (converted_deal_id) REFERENCES deals(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 6. Задачи, Заметки и Вложения
-- ----------------------------------------------------------------------------
CREATE TYPE task_type AS ENUM ('call', 'message', 'meeting', 'other');
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    task_type task_type NOT NULL DEFAULT 'call',
    due_date TIMESTAMPTZ NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL, -- 'deal', 'company', 'contact', 'lead'
    entity_id UUID NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 7. Каталог, Товары, Характеристики, Совместимость
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO categories (name, slug, sort_order) VALUES
('Стаканы бумажные', 'paper-cups', 10),
('Крышки для стаканов', 'cup-lids', 20),
('Капхолдеры и манжеты', 'cupholders', 30),
('Коробки для пиццы', 'pizza-boxes', 40),
('Коробки под пироги и выпечку', 'pastry-boxes', 50),
('Пластиковые шейкеры и стаканы', 'plastic-cups', 60),
('Сопутствующие товары (салфетки, трубочки)', 'accessories', 70)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(64) NOT NULL UNIQUE, -- Артикул
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    material TEXT,       -- картон крафт, белый картон, ПЭТ, полипропилен и т.д.
    volume TEXT,         -- 250 мл, 350 мл, 450 мл
    dimensions TEXT,     -- 25x25x5 см
    diameter TEXT,       -- D80, D90
    layers TEXT,         -- Однослойный, Двухслойный, Гофрированный
    color TEXT,          -- Крафт, Белый, Черный, Брендированный
    unit VARCHAR(16) NOT NULL DEFAULT 'шт', -- шт, упак
    pack_quantity INT DEFAULT 50, -- в упаковке
    min_order_quantity INT DEFAULT 1000,
    order_step INT DEFAULT 500,
    is_active BOOLEAN NOT NULL DEFAULT true,
    images JSONB DEFAULT '[]'::jsonb, -- список {url, is_primary, alt}
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Явные связи совместимости (например крышка D90 подходит к стакану 350 мл D90)
CREATE TABLE IF NOT EXISTS product_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL DEFAULT 'compatible_lid', -- compatible_lid, recommendation, accessory
    CONSTRAINT unique_product_relation UNIQUE (product_id, related_product_id, relation_type)
);

-- ----------------------------------------------------------------------------
-- 8. Версии прайс-листов, ступени цен (Tiers) и правила доплат
-- ----------------------------------------------------------------------------
CREATE TYPE price_list_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
    status price_list_status NOT NULL DEFAULT 'draft',
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS price_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    min_quantity INT NOT NULL, -- нижняя граница тиража (напр. 1000, 5000, 10000)
    max_quantity INT,          -- верхняя граница (null если без ограничения)
    unit_price NUMERIC(14, 2) NOT NULL, -- цена за 1 единицу в KZT
    notes TEXT,
    CONSTRAINT unique_product_tier UNIQUE (price_list_id, product_id, min_quantity)
);

CREATE TYPE surcharge_type AS ENUM (
    'per_unit',          -- доплата за шт (напр. усиленное дно +2 ₸)
    'per_color_unit',    -- доплата за доп. цвет печати за шт
    'one_time_fixed',    -- разовый сбор (напр. клише 15 000 ₸)
    'custom_manual'      -- ручная услуга с обязательным обоснованием
);

CREATE TABLE IF NOT EXISTS surcharge_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    surcharge_type surcharge_type NOT NULL,
    description TEXT,
    default_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    scope TEXT NOT NULL DEFAULT 'all', -- 'all', 'category', 'product'
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Начальные стандартные доплаты
INSERT INTO surcharge_rules (name, surcharge_type, description, default_price, scope) VALUES
('Изготовление клише (печать)', 'one_time_fixed', 'Разовый сбор за изготовление формы печати под заказ', 15000.00, 'all'),
('Усиленное дно стакана', 'per_unit', 'Дополнительное утолщение донной части', 2.00, 'category'),
('Дополнительный цвет печати', 'per_color_unit', 'Доплата за каждый дополнительный цвет свыше базового', 1.50, 'all'),
('Индивидуальная услуга / доставка', 'custom_manual', 'Ручной расчет стоимости нестандартных услуг с основанием', 0.00, 'all')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. Коммерческие предложения (Quotes), Версии и Снимки (Snapshots)
-- ----------------------------------------------------------------------------
CREATE TYPE quote_status AS ENUM ('draft', 'ready', 'sent', 'accepted', 'rejected', 'expired');

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(32) NOT NULL UNIQUE, -- формат: КП-2026-000001
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Коммерческое предложение',
    recipient_name TEXT NOT NULL,
    recipient_company TEXT,
    recipient_phone TEXT,
    recipient_email TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
    status quote_status NOT NULL DEFAULT 'draft',
    valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    payment_terms TEXT DEFAULT '100% предоплата перед запуском в печать',
    production_terms TEXT DEFAULT '10–14 рабочих дней с момента утверждения макета',
    delivery_terms TEXT DEFAULT 'Самовывоз со склада в Алматы либо доставка транспортной компанией',
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Неизменяемые версии КП (при каждом утверждении или изменении)
CREATE TABLE IF NOT EXISTS quote_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_surcharges NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    pdf_path TEXT, -- путь к сгенерированному файлу в Supabase Storage
    is_finalized BOOLEAN NOT NULL DEFAULT false,
    finalized_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_quote_version UNIQUE (quote_id, version_number)
);

-- Снимок товарной позиции (Snapshot)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_version_id UUID NOT NULL REFERENCES quote_versions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sku_snapshot VARCHAR(64) NOT NULL,
    name_snapshot TEXT NOT NULL,
    characteristics_snapshot JSONB DEFAULT '{}'::jsonb, -- материал, объем, цвет, диаметр
    unit_snapshot VARCHAR(16) NOT NULL DEFAULT 'шт',
    image_url_snapshot TEXT,
    quantity NUMERIC(12, 2) NOT NULL,
    base_unit_price NUMERIC(14, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- 0 до 100%
    is_manual_price BOOLEAN NOT NULL DEFAULT false,
    manual_price_reason TEXT,
    item_subtotal NUMERIC(14, 2) NOT NULL, -- (quantity * base_unit_price) * (1 - discount/100)
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Доплаты к позиции или к документу в целом
CREATE TABLE IF NOT EXISTS quote_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_version_id UUID NOT NULL REFERENCES quote_versions(id) ON DELETE CASCADE,
    quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE, -- null если на весь документ
    surcharge_rule_id UUID REFERENCES surcharge_rules(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    charge_type surcharge_type NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_charge NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 10. Настройки компании и Журнал аудита
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'PackCoffee Kazakhstan',
    legal_name TEXT DEFAULT 'ТОО "PackCoffee KZ"',
    bin_iin VARCHAR(12) DEFAULT '123456789012',
    address TEXT DEFAULT 'г. Алматы, ул. Абая, 150',
    phone TEXT DEFAULT '+7 (777) 123-45-67',
    email TEXT DEFAULT 'sales@packcoffee.kz',
    bank_details TEXT DEFAULT 'ИИК: KZ123456789012345678 в АО "Kaspi Bank", БИК: CASPKZKA',
    logo_url TEXT,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
    default_quote_validity_days INT NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO company_settings (company_name) VALUES ('PackCoffee Kazakhstan')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- 'status_change', 'price_change', 'manual_price', 'quote_finalized', etc.
    entity_type TEXT NOT NULL, -- 'deal', 'quote', 'product', 'company', 'lead'
    entity_id UUID NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changes JSONB DEFAULT '{}'::jsonb,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- Индексы для ускорения поиска и отчетов
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contacts_phone_norm ON contacts(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_phone_norm ON leads(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_status ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_quotes_deal ON quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);
