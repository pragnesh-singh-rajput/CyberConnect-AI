'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { RecruitersTable } from '@/components/recruits/recruits-table';
import { RecruitersProvider } from '@/contexts/RecruitersContext';
import { TemplatesProvider } from '@/contexts/TemplatesContext';


export default function RecruitsPage() {
  return (
    // Wrap with Providers here if they are not in a higher layout component for this specific page tree
    // For this app, Providers are in RootLayout, so they are not strictly needed here again.
    // However, if this page was part of a route group without the main layout, you'd add them.
    // For current structure, this is fine.
    // <RecruitersProvider>
    //   <TemplatesProvider>
        <>
          <PageHeader
            title="Recruits"
            description="Manage your list of recruiters and their outreach status."
            actions={
              <Button asChild variant="default">
                <Link href="/recruits/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Recruiter
                </Link>
              </Button>
            }
          />
          <RecruitersTable />
        </>
    //   </TemplatesProvider>
    // </RecruitersProvider>
  );
}
