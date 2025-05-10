
'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input
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
  const { addRecruiter, recruiters: currentRecruiters } = useRecruiters();
  const { templates, userSkills, setUserSkills: updateGlobalUserSkills } = useTemplates();
  const [selectedRecruiterForEmail, setSelectedRecruiterForEmail] = React.useState<Recruiter | null>(null);
  const [isPersonalizeDialogOpen, setIsPersonalizeDialogOpen] = React.useState(false);
  const apiUsage = useApiUsage();
  const [scrapeQuery, setScrapeQuery] = useState(''); // State for the scrape query input

  const handleStartScraping = async () => {
    if (!scrapeQuery || scrapeQuery.trim() === "") {
      toast({
        title: "Scraping Query Required",
        description: "Please enter a search query or URL to start scraping.",
        variant: "destructive",
        duration: 5000,
      });
      return;
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
      description: `Searching for recruiters matching: "${scrapeQuery}" from source: "${source}". This may take a few moments.`,
      variant: "default",
      duration: 7000,
    });

    try {
      const input: ScrapeRecruitersInput = { query: scrapeQuery, source, maxResults: 5 };
      const result = await scrapeRecruiters(input);
      
      let newRecruitersCount = 0;
      if (result && result.scrapedRecruiters && result.scrapedRecruiters.length > 0) {
        result.scrapedRecruiters.forEach(recruiterData => {
          const existing = currentRecruiters.find(r => 
            (r.email && recruiterData.email && r.email.toLowerCase() === recruiterData.email.toLowerCase()) || 
            (r.linkedInProfileUrl && recruiterData.linkedInProfileUrl && r.linkedInProfileUrl.toLowerCase() === recruiterData.linkedInProfileUrl.toLowerCase())
          );
          if (!existing) {
            addRecruiter(recruiterData); 
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
                description: `Scraper found ${result.scrapedRecruiters.length} potential recruiters, but they may already exist in your list. ${result.statusMessage}`,
                variant: "default",
                duration: 7000,
            });
        }
         else { 
            toast({
                title: "No Recruiters Found by Scraper",
                description: result.statusMessage || "The scraping process did not find any recruiters for your query.",
                variant: "default",
                duration: 7000,
            });
        }

      } else { 
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
    // Open mailto link
    const mailtoSubject = encodeURIComponent(subject);
    const mailtoBody = encodeURIComponent(body);
    const mailtoLink = `mailto:${recruiter.email}?subject=${mailtoSubject}&body=${mailtoBody}`;
    window.location.href = mailtoLink;

    toast({ title: 'Email Marked as Sent!', description: `Email to ${recruiter.recruiterName} prepared. Your default email client should open.`, variant: 'default' });
    setIsPersonalizeDialogOpen(false);
  }, [updateRecruiter, toast]);


  return (
    <>
      <PageHeader
        title="Recruiters"
        description="Manage your list of recruiters and their outreach status."
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Enter company name, URL, or LinkedIn profile..."
              value={scrapeQuery}
              onChange={(e) => setScrapeQuery(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[300px]"
              aria-label="Scraping query input"
            />
            <Button onClick={handleStartScraping} disabled={isScraping} variant="outline" className="w-full sm:w-auto">
              {isScraping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isScraping ? 'Scraping...' : 'Start Scraping'}
            </Button>
            <Button asChild variant="default" className="w-full sm:w-auto">
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

