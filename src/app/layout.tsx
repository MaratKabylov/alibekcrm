import type { Metadata } from 'next';
import './globals.css';
import { CRMProvider } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Alibek CRM — Продажа упаковки кофейням',
  description: 'Внутренняя CRM для управления клиентами, сделками, тиражными прайсами и расчетом КП в PDF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <CRMProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </CRMProvider>
      </body>
    </html>
  );
}
