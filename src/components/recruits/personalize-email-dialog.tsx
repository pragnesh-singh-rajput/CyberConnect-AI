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
import { Loader2, Send, Wand2 } from 'lucide-react';
import { Input } from '../ui/input';

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

  useEffect(() => {
    if (recruiter) {
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
      setSelectedTemplateId(defaultTemplate?.id || '');
      setPersonalizedSubject(defaultTemplate?.subject || 'Regarding an Opportunity');
      setPersonalizedBody(''); // Clear body, to be generated
    }
    setCurrentSkills(userSkills.skills);
  }, [recruiter, templates, userSkills]);

  const handleGenerateEmail = async () => {
    if (!recruiter || !selectedTemplateId) {
      toast({ title: 'Error', description: 'Recruiter or template not selected.', variant: 'destructive' });
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
    setPersonalizedBody(''); // Clear previous generation
    setPersonalizedSubject(template.subject); // Reset subject to template default before generation

    try {
      const input: PersonalizeEmailInput = {
        recruiterProfile: `${recruiter.recruiterName}, ${recruiter.title} at ${recruiter.companyName}. ${recruiter.notes || ''}`,
        yourSkills: currentSkills,
        template: `Subject: ${template.subject}\n\n${template.body}`,
      };
      
      const result = await personalizeEmail(input); // Expects { subject: string, body: string }
      
      if (result && result.subject && result.body) {
        setPersonalizedSubject(result.subject);
        setPersonalizedBody(result.body);
        toast({ title: 'Email Personalized', description: 'Review the generated email below.', variant: 'default' });
      } else {
        // This case should ideally be handled by the fallback in the AI flow itself
        // or by more specific error types from the flow.
        console.error('AI did not return expected subject and body directly in dialog:', result);
        setPersonalizedSubject(template.subject.replace(/{recruiter_name}/g, recruiter.recruiterName).replace(/{company_name}/g, recruiter.companyName).replace(/{your_name}/g, "Your Name"));
        setPersonalizedBody(`[AI Personalization Issue - Using Fallback]\n\n${template.body.replace(/{recruiter_name}/g, recruiter.recruiterName).replace(/{company_name}/g, recruiter.companyName).replace(/{your_name}/g, "Your Name").replace(/{your_skills}/g, currentSkills)}`);
        toast({ title: 'AI Issue', description: 'Used fallback content. Please review carefully.', variant: 'default' });
      }

    } catch (error) {
      console.error('Error personalizing email:', error);
      toast({ title: 'AI Error', description: 'Failed to personalize email. Please try again.', variant: 'destructive' });
      // Fallback to a modified template body if AI fails catastrophically
      setPersonalizedSubject(template.subject.replace(/{recruiter_name}/g, recruiter.recruiterName).replace(/{company_name}/g, recruiter.companyName).replace(/{your_name}/g, "Your Name"));
      setPersonalizedBody(`Error generating email. Original template with basic replacements:\n\n${template.body.replace(/{recruiter_name}/g, recruiter.recruiterName).replace(/{company_name}/g, recruiter.companyName).replace(/{your_name}/g, "Your Name").replace(/{your_skills}/g, currentSkills)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recruiter || !personalizedBody || !personalizedSubject) {
      toast({ title: 'Error', description: 'No email content to send.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    onEmailSent(recruiter, personalizedSubject, personalizedBody);
    setIsSending(false);
    onOpenChange(false); // Close dialog
  };

  if (!recruiter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalize Email for {recruiter.recruiterName}</DialogTitle>
          <DialogDescription>
            AI will generate a personalized email based on the selected template and recruiter info.
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
          
          <Button onClick={handleGenerateEmail} disabled={isGenerating || !selectedTemplateId} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Personalized Email
          </Button>

          {(personalizedBody || isGenerating) && ( // Show fields even if body is empty during generation
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="subject" className="text-right">Subject</Label>
                 <Input 
                    id="subject" 
                    value={personalizedSubject} 
                    onChange={(e) => setPersonalizedSubject(e.target.value)} 
                    className="col-span-3"
                    placeholder="Personalized subject will appear here..."
                  />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="email-body" className="text-right pt-2">Email Body</Label>
                <Textarea
                  id="email-body"
                  value={personalizedBody}
                  onChange={(e) => setPersonalizedBody(e.target.value)}
                  className="col-span-3 min-h-[200px]"
                  placeholder={isGenerating ? "Generating AI email..." : "Personalized email content will appear here..."}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSendEmail} disabled={isSending || !personalizedBody || !personalizedSubject || isGenerating}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
