'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
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
  const [scrapeQuery, setScrapeQuery] = useState(''); 

  const handleStartScraping = async () => {
    if (!scrapeQuery || scrapeQuery.trim() === "") {
      toast({
        title: "Scraping Query Required",
        description: "Please enter a search query (keywords or URL) to start scraping.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsScraping(true);
    toast({
      title: "Scraping Started",
      description: `Searching for recruiters based on: "${scrapeQuery}". This may take some time as we search across multiple sources.`,
      variant: "default",
      duration: 10000, // Increased duration for potentially longer process
    });

    try {
      const input: ScrapeRecruitersInput = { query: scrapeQuery, maxResults: 10 }; // Increased maxResults slightly
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
        
        toast({
            title: "Scraping Complete",
            description: `${newRecruitersCount} new potential recruiters added. Total found by scraper: ${result.scrapedRecruiters.length}. ${result.statusMessage}`,
            variant: "default",
            duration: 10000,
        });

      } else { 
        toast({
          title: "No New Recruiters Found",
          description: result.statusMessage || "The scraping process did not find any new recruiters for your query, or they may already be in your list.",
          variant: "default",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Error during scraping:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Scraping Error",
        description: `An error occurred: ${errorMessage}. Please check the console for more details or try a different query.`,
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
    
    let mailtoLink = `mailto:${recruiter.email}`;
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (body) params.append('body', body);
    const queryString = params.toString();
    if (queryString) {
      mailtoLink += `?${queryString}`;
    }

    if (typeof window !== 'undefined') {
      window.location.href = mailtoLink;
    }

    toast({ title: 'Email Marked as Sent!', description: `Email to ${recruiter.recruiterName} prepared. Your default email client should open.`, variant: 'default' });
    setIsPersonalizeDialogOpen(false);
  }, [updateRecruiter, toast]);


  return (
    <>
      <PageHeader
        title="Recruiters"
        description="Manage your list of recruiters and their outreach status."
      />
      <div className="mb-6 p-6 border rounded-lg shadow bg-card">
        <label htmlFor="scrapeQueryInput" className="block text-sm font-medium text-card-foreground mb-1">
          Scraping Query
        </label>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Input
            id="scrapeQueryInput"
            type="text"
            placeholder="Enter keywords (e.g., 'AI Engineer London') or a direct URL..."
            value={scrapeQuery}
            onChange={(e) => setScrapeQuery(e.target.value)}
            className="w-full sm:flex-1 sm:min-w-[300px]"
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
         <p className="text-xs text-muted-foreground mt-2">
            The scraper will search Google and target sites like LinkedIn, Indeed, Glassdoor, etc. Results may vary.
        </p>
      </div>
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
