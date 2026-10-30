import { Quote, CompanySettings } from '@/types/database';

/**
 * Скачивание PDF файла коммерческого предложения напрямую на компьютер пользователя.
 * Файл генерируется на сервере Next.js (Vercel) на лету и не сохраняется в Supabase Storage.
 */
export async function downloadQuotePDF(quote: Quote, settings?: CompanySettings): Promise<void> {
  const response = await fetch('/api/quotes/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quote,
      settings,
      inline: false,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.details || errorJson.error || 'Не удалось сгенерировать PDF на сервере');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  const safeNumber = (quote.quote_number || 'quote').replace(/[^\wа-яА-ЯёЁ\-]/gi, '_');
  a.download = `KP_${safeNumber}.pdf`;
  
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Открытие предпросмотра сгенерированного PDF в новой вкладке браузера.
 * Пользователь может просмотреть документ и сохранить его локально (через встроенные средства браузера).
 */
export async function previewQuotePDF(quote: Quote, settings?: CompanySettings): Promise<void> {
  const response = await fetch('/api/quotes/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quote,
      settings,
      inline: true,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.details || errorJson.error || 'Не удалось сгенерировать PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}

