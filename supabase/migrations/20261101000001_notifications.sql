-- ============================================================================
-- Alibek CRM: Внутрисайтовые уведомления (In-app notifications)
-- Миграция: 20261101000001_notifications.sql
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
    'task_overdue',
    'task_due_today',
    'task_created',
    'task_completed',
    'deal_stage_changed',
    'deal_won',
    'deal_lost',
    'deal_created',
    'quote_status',
    'quote_created',
    'quote_expired',
    'lead_new',
    'lead_converted',
    'system'
);

CREATE TYPE notification_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'system',
    priority notification_priority NOT NULL DEFAULT 'medium',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    entity_type TEXT, -- 'task', 'deal', 'quote', 'lead', 'company', 'system'
    entity_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Индексы для быстрой выборки и фильтрации
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Настройка RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят только свои уведомления"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Пользователи могут отмечать свои уведомления прочитанными"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Пользователи могут удалять свои уведомления"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Сервер и пользователи могут создавать уведомления"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

