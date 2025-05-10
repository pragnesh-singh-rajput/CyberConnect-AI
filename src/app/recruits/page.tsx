
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
  const { addRecruiter, recruiters: currentRecruiters } = useRecruiters(); // Changed addRecruiterFromScrapedData to addRecruiter
  const { templates, userSkills, setUserSkills: updateGlobalUserSkills } = useTemplates();
  const [selectedRecruiterForEmail, setSelectedRecruiterForEmail] = React.useState<Recruiter | null>(null);
  const [isPersonalizeDialogOpen, setIsPersonalizeDialogOpen] = React.useState(false);
  const apiUsage = useApiUsage();


  const handleStartScraping = async () => {
    let query = window.prompt("Enter search query (e.g., 'Google', 'https://careers.google.com', 'AI recruiters NYC', or a LinkedIn profile URL):");
    
    if (!query || query.trim() === "") {
      query = "Tech Recruiter"; 
      toast({
        title: "No Query Provided",
        description: `Using default search query: "${query}". You can specify a query next time.`,
        variant: "default",
        duration: 7000,
      });
    }

    let source: ScrapeRecruitersInput['source'] = 'company_site'; // Default source
    const sourcePromptMessage = "Enter data source:\n" +
    "- 'linkedin' (for direct profile URLs, e.g., https://linkedin.com/in/name)\n" +
    "- 'company_site' (company name like 'Google' or website URL like https://careers.google.com - DEFAULT)\n" +
    "- 'general_web' (search term like 'AI recruiters NYC' for a Google link, or specific webpage URL for direct scraping)\n" +
    "Enter choice (leave blank for default 'company_site'):";
    const userInputSource = window.prompt(sourcePromptMessage)?.trim().toLowerCase();

    if (userInputSource === 'linkedin' || userInputSource === 'company_site' || userInputSource === 'general_web') {
        source = userInputSource as ScrapeRecruitersInput['source'];
    } else if (userInputSource && userInputSource !== "") { // If user entered something invalid
        toast({
            title: "Invalid Source",
            description: `Source "${userInputSource}" is not valid. Using default '${source}'.`,
            variant: "default"
        });
    } // If userInputSource is empty or null, the default 'company_site' is used.


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
      
      let newRecruitersCount = 0;
      if (result && result.scrapedRecruiters && result.scrapedRecruiters.length > 0) {
        result.scrapedRecruiters.forEach(recruiterData => {
          // Check if recruiter already exists (e.g., by email or LinkedIn URL)
          const existing = currentRecruiters.find(r => 
            (r.email && r.email === recruiterData.email) || 
            (r.linkedInProfileUrl && r.linkedInProfileUrl === recruiterData.linkedInProfileUrl)
          );
          if (!existing) {
            addRecruiter(recruiterData); // addRecruiter expects Omit<Recruiter, 'id' | 'status' | 'lastContacted'>
            newRecruitersCount++;
          }
        });
        
        if (newRecruitersCount > 0) {
            toast({
                title: "Scraping Complete",
                description: `${newRecruitersCount} new potential recruiters added. Total found by scraper: ${result.scrapedRecruiters.length}. ${result.statusMessage}`,
                variant: "default",
                duration: 7000,
            });
        } else if (result.scrapedRecruiters.length > 0) {
             toast({
                title: "Scraping Complete",
                description: `Scraper found ${result.scrapedRecruiters.length} potential recruiters, but they already exist in your list. ${result.statusMessage}`,
                variant: "default",
                duration: 7000,
            });
        }
         else { // No recruiters found by scraper
            toast({
                title: "No Recruiters Found by Scraper",
                description: result.statusMessage || "The scraping process did not find any recruiters for your query.",
                variant: "default",
                duration: 7000,
            });
        }

      } else { // result or result.scrapedRecruiters is empty
        toast({
          title: "No Recruiters Found by Scraper",
          description: result.statusMessage || "The scraping process did not find any recruiters for your query.",
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

  const { updateRecruiter } = useRecruiters();


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

