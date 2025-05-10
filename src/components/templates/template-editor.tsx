'use client';

import React, { useState, useEffect } from 'react'; 
import type { EmailTemplate, UserSkills } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, AlertTriangle, Trash2, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface TemplateEditorProps {
  template: EmailTemplate;
  userSkills: UserSkills;
  onSaveTemplate: (template: EmailTemplate) => void;
  onSaveSkills: (skills: string) => void;
  onDeleteTemplate: (id: string) => void;
  onSetDefaultTemplate: (id: string) => void;
  canDelete: boolean;
}

export const TemplateEditor = React.memo(function TemplateEditor({ template, userSkills, onSaveTemplate, onSaveSkills, onDeleteTemplate, onSetDefaultTemplate, canDelete }: TemplateEditorProps) {
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
    onSaveTemplate({ ...template, name, subject, body, isDefault: template.isDefault }); // Preserve isDefault status
    if (skills !== userSkills.skills) {
      onSaveSkills(skills);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <Card className="md:col-span-2 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edit Template: {template.name}</CardTitle>
            <div className="flex gap-2">
             {!template.isDefault && (
                <Button variant="outline" size="sm" onClick={() => onSetDefaultTemplate(template.id)} title="Make this the default template">
                  <Star className="mr-2 h-4 w-4" /> Set as Default
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" title="Delete this template">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the template "{template.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteTemplate(template.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Template
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <CardDescription>
            Modify the subject and body of your email template. Use placeholders for dynamic content.
            {template.isDefault && <span className="ml-2 text-xs font-semibold text-accent">(This is your default template)</span>}
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
              <li><code>{'{your_name}'}</code> - Your name (set by AI or your signature)</li>
              <li><code>{'{your_skills}'}</code> - Your skills (from above)</li>
            </ul>
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-accent mr-2 mt-0.5 shrink-0" />
              <p className="text-xs text-accent-foreground/80">
                Ensure placeholders match exactly. The AI will attempt to fill these based on context.
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
});

TemplateEditor.displayName = 'TemplateEditor';
