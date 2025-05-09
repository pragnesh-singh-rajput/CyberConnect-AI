'use client';

import { useState, useEffect } from 'react';
import type { EmailTemplate, UserSkills } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, AlertTriangle } from 'lucide-react';

interface TemplateEditorProps {
  template: EmailTemplate;
  userSkills: UserSkills;
  onSaveTemplate: (template: EmailTemplate) => void;
  onSaveSkills: (skills: string) => void;
}

export function TemplateEditor({ template, userSkills, onSaveTemplate, onSaveSkills }: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [skills, setSkills] = useState(userSkills.skills);

  useEffect(() => {
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  useEffect(() => {
    setSkills(userSkills.skills);
  }, [userSkills]);

  const handleSave = () => {
    onSaveTemplate({ ...template, name, subject, body });
    if (skills !== userSkills.skills) {
      onSaveSkills(skills);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <Card className="md:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle>Edit Template: {template.name}</CardTitle>
          <CardDescription>
            Modify the subject and body of your email template. Use placeholders for dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="templateName" className="text-sm font-medium">Template Name</Label>
            <Input
              id="templateName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="templateSubject" className="text-sm font-medium">Subject</Label>
            <Input
              id="templateSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Regarding an opportunity at {company_name}"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="templateBody" className="text-sm font-medium">Body</Label>
            <Textarea
              id="templateBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              className="mt-1 min-h-[300px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
            <CardDescription>
              This will be used for the `{'{your_skills}'}` placeholder in emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="userSkills" className="sr-only">Your Skills</Label>
            <Textarea
              id="userSkills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., Python, Machine Learning, Data Analysis"
              className="min-h-[100px] resize-y"
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><code>{'{recruiter_name}'}</code> - Recruiter's full name</li>
              <li><code>{'{company_name}'}</code> - Company name</li>
              <li><code>{'{your_name}'}</code> - Your name (set by AI for now)</li>
              <li><code>{'{your_skills}'}</code> - Your skills (from above)</li>
            </ul>
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
              <p className="text-xs text-accent-foreground/80">
                Ensure placeholders match exactly. The AI will attempt to fill these based on context.
                The `{'{your_name}'}` placeholder might be inferred by the AI or you can add it to your signature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-3 mt-2">
         <Button onClick={handleSave} size="lg" className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save All Changes
          </Button>
      </div>
    </div>
  );
}
