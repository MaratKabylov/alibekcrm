import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { QuotePDFDocument } from '@/lib/pdf/QuotePDFDocument';
import { initialQuotes, initialCompanySettings } from '@/lib/supabase/mock-data';
import { createServerClient } from '@/lib/supabase/server';
import { Quote } from '@/types/database';

function toAsciiSafe(str: string): string {
  const translit: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
    'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
  };
  return str
    .split('')
    .map((c) => translit[c] || c)
    .join('')
    .replace(/[^a-zA-Z0-9\-_.]/g, '_');
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const inline = searchParams.get('inline') === 'true' || searchParams.get('inline') === '1';

    let quote: Quote | null = null;
    let settings = initialCompanySettings;

    const supabase = createServerClient();

    if (supabase) {
      // 1. Получаем КП из Supabase
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (quoteData && !quoteError) {
        // 2. Получаем последнюю версию КП
        const { data: versionData } = await supabase
          .from('quote_versions')
          .select('*')
          .eq('quote_id', id)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (versionData) {
          // 3. Получаем элементы версии (items)
          const { data: itemsData } = await supabase
            .from('quote_items')
            .select('*')
            .eq('quote_version_id', versionData.id)
            .order('sort_order', { ascending: true });

          // 4. Получаем доплаты (charges)
          const { data: chargesData } = await supabase
            .from('quote_charges')
            .select('*')
            .eq('quote_version_id', versionData.id);

          versionData.items = itemsData || [];
          versionData.charges = chargesData || [];
        }

        quote = {
          ...quoteData,
          current_version: versionData || undefined,
        };

        // Загрузка настроек компании
        const { data: settingsData } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (settingsData) {
          settings = settingsData;
        }
      }
    }

    // Если в Supabase не найдено (или при локальной разработке без активной БД), ищем в mock-data
    if (!quote) {
      const mockQuote = initialQuotes.find(
        (q) => q.id === id || q.quote_number === id
      );
      if (mockQuote) {
        quote = mockQuote;
      }
    }

    if (!quote) {
      return NextResponse.json(
        { error: `Коммерческое предложение с ID "${id}" не найдено` },
        { status: 404 }
      );
    }

    // Генерация PDF в буфер на сервере
    const doc = React.createElement(QuotePDFDocument, { quote, settings }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(doc);

    // Безопасное имя файла для HTTP-заголовков (RFC 5987 / RFC 6266):
    const asciiNumber = toAsciiSafe(quote.quote_number || id);
    const asciiFilename = `${asciiNumber}.pdf`;
    const utf8Filename = encodeURIComponent(`${quote.quote_number || id}.pdf`);
    const dispositionType = inline ? 'inline' : 'attachment';

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${dispositionType}; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Ошибка в GET /api/quotes/[id]/pdf:', err);
    return NextResponse.json(
      { error: 'Ошибка генерации PDF на сервере', details: message },
      { status: 500 }
    );
  }
}
