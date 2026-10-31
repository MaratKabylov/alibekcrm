-- ============================================================================
-- CRM для продажи упаковки кофейням (Alibek CRM)
-- Миграция: Воронки продаж (Pipelines) и кастомные статусы сделок
-- Дата: 31.10.2026
-- ============================================================================

-- 1. Создание таблицы воронок продаж (pipelines)
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Индекс для сортировки и поиска
CREATE INDEX IF NOT EXISTS idx_pipelines_sort_order ON pipelines(sort_order);

-- 2. Вставка базовой воронки по умолчанию, если таблица пуста
INSERT INTO pipelines (id, name, description, is_default, sort_order)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Основная воронка (Кофейни)', 'Стандартные продажи стаканов, крышек и сопутствующей упаковки', true, 10),
('22222222-2222-2222-2222-222222222222', 'Крупный опт и дистрибуция', 'Оптовые поставки паллетами, долгосрочные рамочные контракты', false, 20),
('33333333-3333-3333-3333-333333333333', 'Брендирование и спецзаказы', 'Индивидуальная флексопечать, разработка макетов и клише', false, 30)
ON CONFLICT (id) DO NOTHING;

-- 3. Добавление внешнего ключа pipeline_id в deal_stages
ALTER TABLE deal_stages 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE;

-- Привязка существующих стадий к основной воронке
UPDATE deal_stages 
SET pipeline_id = '11111111-1111-1111-1111-111111111111' 
WHERE pipeline_id IS NULL;

-- 4. Добавление внешнего ключа pipeline_id в deals
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;

-- Привязка существующих сделок к воронкам через стадии
UPDATE deals d
SET pipeline_id = ds.pipeline_id
FROM deal_stages ds
WHERE d.stage_id = ds.id AND d.pipeline_id IS NULL;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_deal_stages_pipeline_id ON deal_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON deals(pipeline_id);

-- 5. RLS (Row Level Security) для pipelines
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все авторизованные пользователи могут просматривать воронки"
ON pipelines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Все авторизованные пользователи могут добавлять и изменять воронки"
ON pipelines FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

