'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { NotificationToaster } from '@/components/NotificationToaster';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (isAuthPage) {
    return (
      <>
        {children}
        <NotificationToaster />
      </>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <NotificationToaster />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="app-container"><main className="main-content">{children}</main></div>}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
