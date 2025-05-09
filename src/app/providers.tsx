'use client';

import type React from 'react';
import { RecruitersProvider } from '@/contexts/RecruitersContext';
import { TemplatesProvider } from '@/contexts/TemplatesContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <RecruitersProvider>
      <TemplatesProvider>
        {children}
      </TemplatesProvider>
    </RecruitersProvider>
  );
}
