
'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { RecruitersTable } from '@/components/recruits/recruits-table';
import React, { useState } from 'react'; // Import React and useState
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function RecruitsPage() {
  const [isScraping, setIsScraping] = useState(false);
  const { toast } = useToast();

  const handleStartScraping = () => {
    setIsScraping(true);
    toast({
      title: 'Scraping Started (Simulated)',
      description: 'The system is now looking for new recruiter data online. This may take a moment.',
      variant: 'default',
    });

    // Simulate scraping process
    setTimeout(() => {
      setIsScraping(false);
      toast({
        title: 'Scraping Complete (Simulated)',
        description: 'Finished searching for new recruiters. (No actual data added in this simulation).',
        variant: 'default',
      });
      // In a real application, you might refresh the recruiters list here or show new data.
    }, 5000); // Simulate 5 seconds of scraping
  };

  return (
    <>
      <PageHeader
        title="Recruiters"
        description="Manage your list of recruiters and their outreach status."
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleStartScraping} disabled={isScraping} variant="outline">
              {isScraping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isScraping ? 'Scraping...' : 'Start Scraping'}
            </Button>
            <Button asChild variant="default">
              <Link href="/recruits/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Recruiter
              </Link>
            </Button>
          </div>
        }
      />
      <RecruitersTable />
    </>
  );
}
