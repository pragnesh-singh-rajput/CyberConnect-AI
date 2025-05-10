'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlusCircle } from 'lucide-react';

interface AddTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTemplate: (name: string, subject: string, body: string, makeDefault: boolean) => void;
}

export function AddTemplateDialog({ isOpen, onOpenChange, onAddTemplate }: AddTemplateDialogProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);

  const handleSubmit = () => {
    if (name.trim() && subject.trim() && body.trim()) {
      onAddTemplate(name, subject, body, makeDefault);
      // Reset form for next time
      setName('');
      setSubject('');
      setBody('');
      setMakeDefault(false);
    } else {
      // Basic validation feedback, could use react-hook-form for more complex scenarios
      alert('Please fill in all fields: Name, Subject, and Body.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-accent" /> Add New Email Template
          </DialogTitle>
          <DialogDescription>
            Create a new reusable email template. You can use placeholders like {'{recruiter_name}'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template-name" className="text-right">
              Name
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Initial Outreach Template"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template-subject" className="text-right">
              Subject
            </Label>
            <Input
              id="template-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Inquiry about opportunities at {company_name}"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="template-body" className="text-right pt-2">
              Body
            </Label>
            <Textarea
              id="template-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="col-span-3 min-h-[200px]"
              placeholder="Dear {recruiter_name}, ..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="make-default" className="text-right">
              Set as Default
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="make-default"
                checked={makeDefault}
                onCheckedChange={setMakeDefault}
              />
              <Label htmlFor="make-default" className="text-sm text-muted-foreground">
                Make this the default template for new emails.
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
