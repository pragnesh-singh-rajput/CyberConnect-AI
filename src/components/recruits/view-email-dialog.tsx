'use client';

import type { Recruiter } from '@/types';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ViewEmailDialogProps {
  recruiter: Recruiter | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewEmailDialog({ recruiter, isOpen, onOpenChange }: ViewEmailDialogProps) {
  if (!recruiter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sent Email to {recruiter.recruiterName}</DialogTitle>
          <DialogDescription>
            This is the content of the email that was sent.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">Subject</Label>
            <Input 
              id="subject" 
              value={recruiter.personalizedEmailSubject || 'N/A'} 
              readOnly 
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="email-body" className="text-right pt-2">Email Body</Label>
            <Textarea
              id="email-body"
              value={recruiter.personalizedEmailBody || 'No content recorded.'}
              readOnly
              className="col-span-3 min-h-[200px] bg-muted/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
