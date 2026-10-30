-- ============================================================================
-- RLS Политики и Триггеры для Alibek CRM
-- ============================================================================

-- Включаем RLS на всех основных таблицах
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE surcharge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Вспомогательные функции проверки прав пользователя
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_employee()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. Profiles RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Active employees can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage profiles"
ON profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. CRM Core: Компании, Контакты, Лиды, Сделки, Задачи
-- (Общая видимость для сотрудников согласно ТЗ п. 2)
-- ----------------------------------------------------------------------------
-- Компании
CREATE POLICY "Employees can view companies"
ON companies FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can insert companies"
ON companies FOR INSERT TO authenticated
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can update companies"
ON companies FOR UPDATE TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

-- Адреса компаний
CREATE POLICY "Employees can manage company addresses"
ON company_addresses FOR ALL TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

-- Контакты
CREATE POLICY "Employees can view contacts"
ON contacts FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can insert contacts"
ON contacts FOR INSERT TO authenticated
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can update contacts"
ON contacts FOR UPDATE TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

-- Лиды и источники
CREATE POLICY "Employees can view lead sources"
ON lead_sources FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can manage leads"
ON leads FOR ALL TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

-- Сделки и стадии
CREATE POLICY "Employees can view deal stages"
ON deal_stages FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage deal stages"
ON deal_stages FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view deals"
ON deals FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can insert deals"
ON deals FOR INSERT TO authenticated
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can update deals"
ON deals FOR UPDATE TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

-- Задачи, Заметки и Вложения
CREATE POLICY "Employees can manage tasks"
ON tasks FOR ALL TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can manage notes"
ON notes FOR ALL TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can manage attachments"
ON attachments FOR ALL TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

-- ----------------------------------------------------------------------------
-- 3. Каталог, Прайсы и Доплаты
-- Менеджеры могут только читать; только Администраторы могут менять товары и прайс
-- ----------------------------------------------------------------------------
CREATE POLICY "Employees can view categories"
ON categories FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view products"
ON products FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage products"
ON products FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view product relations"
ON product_relations FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage product relations"
ON product_relations FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view price lists"
ON price_lists FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage price lists"
ON price_lists FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view price tiers"
ON price_tiers FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage price tiers"
ON price_tiers FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view surcharge rules"
ON surcharge_rules FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can manage surcharge rules"
ON surcharge_rules FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Коммерческие предложения (Quotes) и Снимки
-- Менеджеры могут создавать и редактировать черновики, финализированные версии защищены
-- ----------------------------------------------------------------------------
CREATE POLICY "Employees can view quotes"
ON quotes FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can manage quotes"
ON quotes FOR ALL TO authenticated
USING (public.is_active_employee())
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can view quote versions"
ON quote_versions FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can insert quote versions"
ON quote_versions FOR INSERT TO authenticated
WITH CHECK (public.is_active_employee());

-- Запрет модификации уже финализированной версии КП
CREATE POLICY "Employees can update only draft quote versions"
ON quote_versions FOR UPDATE TO authenticated
USING (public.is_active_employee() AND is_finalized = false)
WITH CHECK (public.is_active_employee());

CREATE POLICY "Employees can view quote items"
ON quote_items FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can manage items in draft quotes"
ON quote_items FOR ALL TO authenticated
USING (
    public.is_active_employee() AND 
    EXISTS (
        SELECT 1 FROM quote_versions qv 
        WHERE qv.id = quote_items.quote_version_id 
          AND qv.is_finalized = false
    )
)
WITH CHECK (
    public.is_active_employee() AND 
    EXISTS (
        SELECT 1 FROM quote_versions qv 
        WHERE qv.id = quote_items.quote_version_id 
          AND qv.is_finalized = false
    )
);

CREATE POLICY "Employees can view quote charges"
ON quote_charges FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Employees can manage charges in draft quotes"
ON quote_charges FOR ALL TO authenticated
USING (
    public.is_active_employee() AND 
    EXISTS (
        SELECT 1 FROM quote_versions qv 
        WHERE qv.id = quote_charges.quote_version_id 
          AND qv.is_finalized = false
    )
)
WITH CHECK (
    public.is_active_employee() AND 
    EXISTS (
        SELECT 1 FROM quote_versions qv 
        WHERE qv.id = quote_charges.quote_version_id 
          AND qv.is_finalized = false
    )
);

-- Настройки компании и Аудит
CREATE POLICY "Employees can view company settings"
ON company_settings FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "Admins can update company settings"
ON company_settings FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view audit events"
ON audit_events FOR SELECT TO authenticated
USING (public.is_active_employee());

CREATE POLICY "System and employees can insert audit events"
ON audit_events FOR INSERT TO authenticated
WITH CHECK (public.is_active_employee());

-- ----------------------------------------------------------------------------
-- Триггер автоматической синхронизации нового пользователя из auth.users в profiles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'manager')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
