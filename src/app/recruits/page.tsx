
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


export default function RecruitersPage() {
  const [isScraping, setIsScraping] = useState(false);
  const { toast } = useToast();
  const { addRecruiterFromScrapedData, updateRecruiter } = useRecruiters();
  const { templates, userSkills, setUserSkills: updateGlobalUserSkills } = useTemplates();
  const [selectedRecruiterForEmail, setSelectedRecruiterForEmail] = React.useState<Recruiter | null>(null);
  const [isPersonalizeDialogOpen, setIsPersonalizeDialogOpen] = React.useState(false);
  const apiUsage = useApiUsage();


  const handleStartScraping = async () => {
    let query = window.prompt("Enter your search query for recruiters (e.g., 'Tech Recruiters at Google', 'Software Engineer Recruiter New York', or a company careers page URL like 'https://careers.google.com'):");
    
    if (!query || query.trim() === "") {
      query = "Technical Recruiter"; // Default query
      toast({
        title: "No Query Provided by User",
        description: `Using default search query: "${query}". You can specify a query next time.`,
        variant: "default",
        duration: 7000,
      });
    }

    let source: ScrapeRecruitersInput['source'] = 'general_web';
    const sourcePrompt = window.prompt("Enter data source ('linkedin', 'company_site', or 'general_web' - default is 'general_web'):")?.trim().toLowerCase();
    if (sourcePrompt === 'linkedin' || sourcePrompt === 'company_site' || sourcePrompt === 'general_web') {
        source = sourcePrompt as ScrapeRecruitersInput['source'];
    } else if (sourcePrompt && sourcePrompt !== "") {
        toast({
            title: "Invalid Source",
            description: `Source "${sourcePrompt}" is not valid. Using default 'general_web'.`,
            variant: "default"
        });
    }


    setIsScraping(true);
    toast({
      title: "Scraping Started",
      description: `Searching for recruiters matching: "${query}" from source: "${source}". This may take a few moments.`,
      variant: "default",
      duration: 7000,
    });

    try {
      const input: ScrapeRecruitersInput = { query, source, maxResults: 5 };
      const result = await scrapeRecruiters(input);

      if (result && result.scrapedRecruiters && result.scrapedRecruiters.length > 0) {
        result.scrapedRecruiters.forEach(recruiterData => {
          // Assuming addRecruiter can handle ScrapedRecruiter type or you have a conversion function
          addRecruiterFromScrapedData(recruiterData);
        });
        toast({
          title: "Scraping Complete",
          description: `${result.scrapedRecruiters.length} potential recruiters added. ${result.statusMessage}`,
          variant: "default",
          duration: 7000,
        });
      } else {
        toast({
          title: "No New Recruiters Found",
          description: result.statusMessage || "The scraping process did not find any new recruiters for your query.",
          variant: "default",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Error during scraping:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Scraping Error",
        description: `An error occurred: ${errorMessage}. Please check the console for more details or try a different query/source.`,
        variant: "destructive",
        duration: 10000,
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
    // The actual email sending happens via mailto link triggered in PersonalizeEmailDialog
    // Toast here confirms the state update and intent.
    toast({ title: 'Email Marked as Sent!', description: `Email to ${recruiter.recruiterName} prepared. Your default email client should open.`, variant: 'default' });
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
