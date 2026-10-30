import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

let isRegistered = false;

export function registerPDFFonts() {
  if (isRegistered) return;

  const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
  const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

  if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
    Font.register({
      family: 'Roboto',
      fonts: [
        { src: regularFontPath, fontWeight: 'normal' },
        { src: boldFontPath, fontWeight: 'bold' },
      ],
    });
  } else {
    // Fallback на CDN для Vercel / serverless если статические файлы лежат по альтернативному пути
    Font.register({
      family: 'Roboto',
      fonts: [
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
          fontWeight: 'normal',
        },
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
          fontWeight: 'bold',
        },
      ],
    });
  }

  // Отключаем английский перенос слов, чтобы русские слова не разрывались некорректно
  Font.registerHyphenationCallback((word) => [word]);

  isRegistered = true;
}

