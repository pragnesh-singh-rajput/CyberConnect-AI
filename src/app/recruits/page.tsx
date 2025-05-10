'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2, Send } from 'lucide-react';
import { RecruitersTable } from '@/components/recruits/recruits-table';
import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRecruiters } from '@/contexts/RecruitersContext';
import { useTemplates } from '@/contexts/TemplatesContext';
import type { Recruiter } from '@/types';
import { PersonalizeEmailDialog } from '@/components/recruits/personalize-email-dialog';
import { useApiUsage } from '@/contexts/ApiUsageContext';
import { scrapeRecruiters, type ScrapeRecruitersInput } from '@/ai/flows/scrape-recruiters-flow';


export default function RecruitsPage() {
  const [isScraping, setIsScraping] = useState(false);
  const { toast } = useToast();
  const { recruiters, updateRecruiter, addRecruiter } = useRecruiters();
  const { templates, userSkills, setUserSkills: updateGlobalUserSkills } = useTemplates();
  const [selectedRecruiterForEmail, setSelectedRecruiterForEmail] = React.useState<Recruiter | null>(null);
  const [isPersonalizeDialogOpen, setIsPersonalizeDialogOpen] = React.useState(false);
  const apiUsage = useApiUsage();


  const handleStartScraping = async () => {
    const query = window.prompt("Enter your search query for recruiters (e.g., 'Tech Recruiters at Google'):");
    if (!query || query.trim() === "") {
      toast({
        title: "Scraping Cancelled",
        description: "No search query provided.",
        variant: "default",
      });
      return;
    }

    setIsScraping(true);
    toast({
      title: "Scraping Started (Simulation)",
      description: `Searching for recruiters matching: "${query}". This is a simulation and will return dummy data. Actual scraping of sites like LinkedIn is against their ToS.`,
      variant: "default",
      duration: 7000,
    });

    try {
      const input: ScrapeRecruitersInput = { query };
      const result = await scrapeRecruiters(input);

      if (result && result.scrapedRecruiters && result.scrapedRecruiters.length > 0) {
        result.scrapedRecruiters.forEach(recruiterData => {
          addRecruiter(recruiterData);
        });
        toast({
          title: "Scraping Complete (Simulated)",
          description: `${result.scrapedRecruiters.length} potential recruiters (dummy data) added.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Recruiters Found (Simulated)",
          description: "The simulated scraping did not find any recruiters for your query.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error during scraping simulation:", error);
      toast({
        title: "Scraping Error (Simulated)",
        description: "An error occurred during the simulated scraping process. Please check the console.",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleOpenPersonalizeDialog = useCallback((recruiter: Recruiter) => {
    if (!apiUsage.canMakeApiCall() && !(recruiter.personalizedEmailBody && recruiter.personalizedEmailSubject)) {
       toast({
        title: 'AI Limit Reached',
        description: `You have reached your daily limit of ${apiUsage.getLimit()} AI personalizations. You can still send manually or use previously generated content.`,
        variant: 'destructive',
      });
    }
    setSelectedRecruiterForEmail(recruiter);
    setIsPersonalizeDialogOpen(true);
  }, [apiUsage, toast]);

  const handleEmailSent = useCallback((recruiter: Recruiter, subject: string, body: string) => {
    updateRecruiter({
      ...recruiter,
      status: 'sent',
      lastContacted: new Date().toISOString(),
      personalizedEmailSubject: subject,
      personalizedEmailBody: body,
    });
    toast({ title: 'Email Sent!', description: `Personalized email sent to ${recruiter.recruiterName}.`, variant: 'default' });
    setIsPersonalizeDialogOpen(false);
  }, [updateRecruiter, toast]);


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
              {isScraping ? 'Scraping...' : 'Start Scraping (Simulated)'}
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
      <RecruitersTable onAction={handleOpenPersonalizeDialog} actionIcon={Send} actionLabel="Personalize & Send" />
      {selectedRecruiterForEmail && (
        <PersonalizeEmailDialog
          recruiter={selectedRecruiterForEmail}
          templates={templates}
          userSkills={userSkills}
          isOpen={isPersonalizeDialogOpen}
          onOpenChange={setIsPersonalizeDialogOpen}
          onEmailSent={handleEmailSent}
          onUpdateUserSkills={updateGlobalUserSkills}
        />
      )}
    </>
  );
}
