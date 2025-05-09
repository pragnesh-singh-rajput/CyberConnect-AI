'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { RecruiterForm } from '@/components/recruits/recruiter-form';
import { useRecruiters } from '@/contexts/RecruitersContext';
import { useToast } from '@/hooks/use-toast';
import type { Recruiter } from '@/types';

export default function AddRecruiterPage() {
  const router = useRouter();
  const { addRecruiter } = useRecruiters();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<Recruiter, 'id' | 'status' | 'lastContacted'>) => {
    setIsSubmitting(true);
    try {
      addRecruiter(data);
      toast({
        title: 'Recruiter Added',
        description: `${data.recruiterName} has been successfully added.`,
        variant: 'default',
      });
      router.push('/recruits');
    } catch (error) {
      console.error('Failed to add recruiter:', error);
      toast({
        title: 'Error',
        description: 'Failed to add recruiter. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add New Recruiter"
        description="Enter the details of the recruiter you want to connect with."
      />
      <RecruiterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
}
