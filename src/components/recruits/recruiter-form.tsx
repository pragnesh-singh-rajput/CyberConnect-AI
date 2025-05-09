'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Recruiter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save } from 'lucide-react';

const recruiterFormSchema = z.object({
  recruiterName: z.string().min(2, { message: 'Recruiter name must be at least 2 characters.' }),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters.' }),
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  linkedInProfileUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  notes: z.string().optional(),
});

type RecruiterFormValues = z.infer<typeof recruiterFormSchema>;

interface RecruiterFormProps {
  initialData?: Recruiter;
  onSubmit: (data: RecruiterFormValues) => void;
  isSubmitting?: boolean;
}

export function RecruiterForm({ initialData, onSubmit, isSubmitting }: RecruiterFormProps) {
  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterFormSchema),
    defaultValues: {
      recruiterName: initialData?.recruiterName || '',
      companyName: initialData?.companyName || '',
      title: initialData?.title || '',
      email: initialData?.email || '',
      linkedInProfileUrl: initialData?.linkedInProfileUrl || '',
      notes: initialData?.notes || '',
    },
  });

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Recruiter' : 'Add New Recruiter'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="recruiterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recruiter Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Recruiter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedInProfileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://linkedin.com/in/janedoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Recruiter Profile Info)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste any relevant recruiter profile information here for AI personalization..."
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This information will be used by the AI to personalize emails.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Recruiter')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
