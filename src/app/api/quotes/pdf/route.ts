import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { QuotePDFDocument } from '@/lib/pdf/QuotePDFDocument';
import { initialCompanySettings } from '@/lib/supabase/mock-data';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quote, settings = initialCompanySettings, inline = false } = body;

    if (!quote || !quote.quote_number) {
      return NextResponse.json(
        { error: 'Не переданы данные коммерческого предложения' },
        { status: 400 }
      );
    }

    const doc = React.createElement(QuotePDFDocument, { quote, settings }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(doc);

    // Безопасное имя файла для HTTP-заголовков (RFC 5987 / RFC 6266):
    const asciiNumber = toAsciiSafe(quote.quote_number || 'quote');
    const asciiFilename = `${asciiNumber}.pdf`;
    const utf8Filename = encodeURIComponent(`${quote.quote_number || 'quote'}.pdf`);
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
    console.error('Ошибка серверной генерации PDF:', err);
    return NextResponse.json(
      { error: 'Ошибка генерации PDF на сервере', details: message },
      { status: 500 }
    );
  }
}
