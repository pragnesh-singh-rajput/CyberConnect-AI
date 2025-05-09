
'use client';

import type React from 'react';
import { RecruitersProvider } from '@/contexts/RecruitersContext';
import { TemplatesProvider } from '@/contexts/TemplatesContext';
import { ApiUsageProvider } from '@/contexts/ApiUsageContext'; // Import ApiUsageProvider

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ApiUsageProvider> {/* Wrap with ApiUsageProvider */}
      <RecruitersProvider>
        <TemplatesProvider>
          {children}
        </TemplatesProvider>
      </RecruitersProvider>
    </ApiUsageProvider>
  );
}
