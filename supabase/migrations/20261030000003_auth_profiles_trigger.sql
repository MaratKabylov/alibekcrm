-- ============================================================================
-- Улучшенный триггер автоматической синхронизации Supabase Auth -> profiles
-- и RLS политики для профилей пользователей
-- ============================================================================

-- 0. Убеждаемся, что тип user_role существует
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'manager');
    END IF;
END $$;

-- 1. Безопасная функция обработки нового пользователя Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    assigned_role public.user_role;
    user_name TEXT;
    user_email TEXT;
BEGIN
    user_email := COALESCE(new.email, '');

    -- Извлекаем имя из метаданных (поддержка full_name, name или берем часть email)
    user_name := COALESCE(
        NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
        NULLIF(split_part(user_email, '@', 1), ''),
        'Сотрудник'
    );

    -- Безопасно определяем роль (по умолчанию 'manager')
    IF (new.raw_user_meta_data->>'role') = 'admin' THEN
        assigned_role := 'admin'::public.user_role;
    ELSE
        assigned_role := 'manager'::public.user_role;
    END IF;

    -- Удаляем старые записи с таким email, если они остались от предыдущих удаленных пользователей
    IF user_email <> '' THEN
        DELETE FROM public.profiles WHERE lower(email) = lower(user_email) AND id != new.id;
    END IF;

    -- Идемпотентная вставка профиля
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        phone,
        avatar_url,
        is_active, 
        created_at, 
        updated_at
    )
    VALUES (
        new.id,
        user_email,
        user_name,
        assigned_role,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'avatar_url',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        updated_at = now();

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Логируем предупреждение в Postgres Logs, не блокируя создание пользователя в auth.users
        RAISE WARNING 'handle_new_user error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        RETURN new;
END;
$$;

-- Пересоздаем триггер на auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Предоставляем необходимые права
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- 2. Политики RLS для profiles
-- Пользователь всегда может прочитать свой собственный профиль
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;

-- Пользователь может обновить поля своего профиля (имя, телефон, аватар)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 3. Вспомогательная функция для назначения роли администратора
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    found_count INT;
BEGIN
    UPDATE public.profiles
    SET role = 'admin', updated_at = now()
    WHERE lower(email) = lower(user_email);

    GET DIAGNOSTICS found_count = ROW_COUNT;

    IF found_count > 0 THEN
        RETURN 'Пользователь ' || user_email || ' успешно повышен до Администратора.';
    ELSE
        RETURN 'Пользователь с email ' || user_email || ' не найден в таблице profiles.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

