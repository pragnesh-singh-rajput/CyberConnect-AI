'use client';

import { useState, useEffect } from 'react';
import type { Recruiter, EmailTemplate, UserSkills } from '@/types';
import { personalizeEmail, type PersonalizeEmailInput } from '@/ai/flows/personalize-email';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Wand2, Info } from 'lucide-react';
import { Input } from '../ui/input';
import { useApiUsage } from '@/contexts/ApiUsageContext';

interface PersonalizeEmailDialogProps {
  recruiter: Recruiter | null;
  templates: EmailTemplate[];
  userSkills: UserSkills;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSent: (recruiter: Recruiter, subject: string, body: string) => void;
  onUpdateUserSkills: (skills: string) => void;
}

export function PersonalizeEmailDialog({
  recruiter,
  templates,
  userSkills,
  isOpen,
  onOpenChange,
  onEmailSent,
  onUpdateUserSkills,
}: PersonalizeEmailDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentSkills, setCurrentSkills] = useState<string>('');
  const [personalizedSubject, setPersonalizedSubject] = useState('');
  const [personalizedBody, setPersonalizedBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const apiUsage = useApiUsage();

  useEffect(() => {
    if (recruiter) {
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
      setCurrentSkills(userSkills.skills); // Set skills first as they might be used in template prefill

      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);

        // If recruiter already has personalized content, use that for display
        if (recruiter.personalizedEmailSubject && recruiter.personalizedEmailBody) {
          setPersonalizedSubject(recruiter.personalizedEmailSubject);
          setPersonalizedBody(recruiter.personalizedEmailBody);
        } else {
          // Otherwise, initialize from the selected template with basic replacements
          const initialSubject = defaultTemplate.subject
            .replace(/{recruiter_name}/gi, recruiter.recruiterName)
            .replace(/{company_name}/gi, recruiter.companyName);
          // Note: {your_name} and {your_skills} are typically handled by the AI or user's signature.
          // The AI gets the raw template and `currentSkills` separately.

          const initialBody = defaultTemplate.body
            .replace(/{recruiter_name}/gi, recruiter.recruiterName)
            .replace(/{company_name}/gi, recruiter.companyName)
            .replace(/{your_skills}/gi, userSkills.skills); // Prefill skills from context

          setPersonalizedSubject(initialSubject);
          setPersonalizedBody(initialBody);
        }
      } else {
        // Fallback if no templates exist (should be rare with initial data)
        setPersonalizedSubject('Regarding an Opportunity');
        setPersonalizedBody('');
      }
    } else {
      // Clear fields if no recruiter is selected (e.g., dialog closes and reopens for no one)
      setPersonalizedSubject('');
      setPersonalizedBody('');
      setCurrentSkills('');
      setSelectedTemplateId('');
    }
  }, [recruiter, templates, userSkills]);


  const handleGenerateEmail = async () => {
    if (!recruiter || !selectedTemplateId) {
      toast({ title: 'Error', description: 'Recruiter or template not selected.', variant: 'destructive' });
      return;
    }

    if (!apiUsage.canMakeApiCall()) {
      toast({
        title: 'AI Limit Reached',
        description: `You have reached your daily limit of ${apiUsage.getLimit()} AI personalizations. Please try again tomorrow.`,
        variant: 'destructive',
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      toast({ title: 'Error', description: 'Selected template not found.', variant: 'destructive' });
      return;
    }
    
    if (currentSkills !== userSkills.skills) {
      onUpdateUserSkills(currentSkills);
    }

    setIsGenerating(true);
    // Don't clear subject/body here, AI will overwrite them if successful

    try {
      const input: PersonalizeEmailInput = {
        recruiterProfile: `${recruiter.recruiterName}, ${recruiter.title} at ${recruiter.companyName}. ${recruiter.notes || ''}`,
        yourSkills: currentSkills, // Use the potentially updated skills from the dialog
        template: `Subject: ${template.subject}\n\n${template.body}`, // AI always gets the raw template
      };
      
      const result = await personalizeEmail(input); 
      
      if (result && result.subject && result.body) {
        setPersonalizedSubject(result.subject);
        setPersonalizedBody(result.body);
        toast({ title: 'Email Personalized', description: 'Review the generated email below.', variant: 'default' });
      } else {
        // This case is now less likely due to fallback in personalizeEmailFlow
        // but kept for robustness if the flow itself has an issue before its own fallback.
        console.error('AI did not return expected subject and body directly in dialog:', result);
        const fallbackSubject = template.subject
            .replace(/{recruiter_name}/gi, recruiter.recruiterName)
            .replace(/{company_name}/gi, recruiter.companyName);
        const fallbackBody = `[AI Personalization Issue - Using Fallback]\n\n${template.body
            .replace(/{recruiter_name}/gi, recruiter.recruiterName)
            .replace(/{company_name}/gi, recruiter.companyName)
            .replace(/{your_skills}/gi, currentSkills)}`;
        setPersonalizedSubject(fallbackSubject);
        setPersonalizedBody(fallbackBody);
        toast({ title: 'AI Issue', description: 'Used fallback content. Please review carefully.', variant: 'default' });
      }

    } catch (error) {
      console.error('Error personalizing email:', error);
      toast({ title: 'AI Error', description: 'Failed to personalize email. Please try again.', variant: 'destructive' });
      // Revert to template with basic replacement if AI fails catastrophically
       const fallbackSubject = template.subject
            .replace(/{recruiter_name}/gi, recruiter.recruiterName)
            .replace(/{company_name}/gi, recruiter.companyName);
        const fallbackBody = `Error generating email. Original template with basic replacements:\n\n${template.body
            .replace(/{recruiter_name}/gi, recruiter.recruiterName)
            .replace(/{company_name}/gi, recruiter.companyName)
            .replace(/{your_skills}/gi, currentSkills)}`;
      setPersonalizedSubject(fallbackSubject);
      setPersonalizedBody(fallbackBody);
    } finally {
      apiUsage.recordApiCall(); 
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recruiter || !personalizedBody || !personalizedSubject) {
      toast({ title: 'Error', description: 'No email content to send.', variant: 'destructive' });
      return;
    }
    if (!recruiter.email) {
      toast({ title: 'Error', description: 'Recruiter email address is missing.', variant: 'destructive' });
      return;
    }

    setIsSending(true);

    try {
      const mailtoSubject = encodeURIComponent(personalizedSubject);
      const mailtoBody = encodeURIComponent(personalizedBody);
      const mailtoLink = `mailto:${recruiter.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

      window.location.href = mailtoLink;
      onEmailSent(recruiter, personalizedSubject, personalizedBody);
      
    } catch (error) {
      console.error("Error preparing email for sending:", error);
      toast({ title: 'Error', description: 'Could not prepare email for sending. Please try again.', variant: 'destructive' });
    } finally {
      setIsSending(false);
      onOpenChange(false); 
    }
  };

  if (!recruiter) return null;

  const remainingCalls = apiUsage.getRemainingCalls();
  const canGenerate = apiUsage.canMakeApiCall();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalize Email for {recruiter.recruiterName}</DialogTitle>
          <DialogDescription>
            AI can generate a personalized email. Review and edit before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right">Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="skills" className="text-right pt-2">Your Skills</Label>
            <Textarea
              id="skills"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              className="col-span-3 min-h-[80px]"
              placeholder="e.g., React, Next.js, AI integration"
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Daily AI generations remaining: {remainingCalls}/{apiUsage.getLimit()}
            </p>
          </div>
          
          <Button onClick={handleGenerateEmail} disabled={isGenerating || !selectedTemplateId || !canGenerate} className="w-full mt-1">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Personalized Email
          </Button>
          {!canGenerate && !isGenerating && (
            <p className="text-xs text-destructive text-center mt-1">Daily AI generation limit reached.</p>
          )}

          <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="subject" className="text-right">Subject</Label>
              <Input 
                id="subject" 
                value={personalizedSubject} 
                onChange={(e) => setPersonalizedSubject(e.target.value)} 
                className="col-span-3"
                placeholder="Email subject will appear here..."
              />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="email-body" className="text-right pt-2">Email Body</Label>
            <Textarea
              id="email-body"
              value={personalizedBody}
              onChange={(e) => setPersonalizedBody(e.target.value)}
              className="col-span-3 min-h-[200px]"
              placeholder={isGenerating ? "Generating AI email..." : "Email content will appear here..."}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending || isGenerating}>Cancel</Button>
          <Button onClick={handleSendEmail} disabled={isSending || !personalizedBody || !personalizedSubject || isGenerating}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
