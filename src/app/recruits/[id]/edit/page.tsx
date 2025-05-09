'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { RecruiterForm } from '@/components/recruits/recruiter-form';
import { useRecruiters } from '@/contexts/RecruitersContext';
import { useToast } from '@/hooks/use-toast';
import type { Recruiter } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditRecruiterPage() {
  const router = useRouter();
  const params = useParams();
  const { getRecruiterById, updateRecruiter } = useRecruiters();
  const { toast } = useToast();

  const [recruiter, setRecruiter] = useState<Recruiter | null | undefined>(undefined); // undefined for loading, null if not found
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recruiterId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (recruiterId) {
      const foundRecruiter = getRecruiterById(recruiterId);
      setRecruiter(foundRecruiter);
    } else {
      // Should not happen if route is matched correctly, but good for robustness
      setRecruiter(null); 
    }
  }, [recruiterId, getRecruiterById]);

  const handleSubmit = async (data: Omit<Recruiter, 'id' | 'status' | 'lastContacted'>) => {
    if (!recruiter || !recruiterId) return;

    setIsSubmitting(true);
    try {
      // Preserve existing status, lastContacted, and personalized email details unless they are meant to be editable here
      const updatedData: Recruiter = {
        ...recruiter, // spread existing recruiter to keep fields like status, lastContacted
        ...data, // spread new form data which overwrites common fields
        id: recruiterId, // ensure id is correct
      };
      updateRecruiter(updatedData);
      toast({
        title: 'Recruiter Updated',
        description: `${data.recruiterName} has been successfully updated.`,
        variant: 'default',
      });
      router.push('/recruits');
    } catch (error) {
      console.error('Failed to update recruiter:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recruiter. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  if (recruiter === undefined) {
    // Loading state
    return (
      <>
        <PageHeader
          title="Edit Recruiter"
          description="Loading recruiter details..."
           actions={
            <Button variant="outline" asChild>
              <Link href="/recruits">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Recruits
              </Link>
            </Button>
          }
        />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/4" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (!recruiter) {
    // Not found state
    return (
      <>
        <PageHeader
          title="Error"
          description="Recruiter not found."
          actions={
            <Button variant="outline" asChild>
              <Link href="/recruits">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Recruits
              </Link>
            </Button>
          }
        />
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Recruiter Not Found</CardTitle>
            <CardDescription>
              The recruiter you are trying to edit does not exist or could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please check the ID or go back to the recruits list.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Recruiter"
        description={`Update the details for ${recruiter.recruiterName}.`}
        actions={
            <Button variant="outline" asChild>
              <Link href="/recruits">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Recruits
              </Link>
            </Button>
          }
      />
      <RecruiterForm
        initialData={recruiter}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
