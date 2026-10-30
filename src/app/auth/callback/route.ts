import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Успешный обмен кода на сессию, перенаправляем на целевую страницу
      const forwardParams = new URL(next, requestUrl.origin);
      return NextResponse.redirect(forwardParams);
    }
    
    console.error('Auth callback exchangeCodeForSession error:', error.message);
  }

  // Если код отсутствует или произошла ошибка — перенаправляем на логин с сообщением об ошибке
  const loginUrl = new URL('/login', requestUrl.origin);
  loginUrl.searchParams.set('error', 'auth_callback_failed');
  return NextResponse.redirect(loginUrl);
}

