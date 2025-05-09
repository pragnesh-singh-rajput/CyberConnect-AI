'use client';

import type React from 'react';
import { createContext, useContext, useMemo, useCallback } from 'react';
import type { Recruiter } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

interface RecruitersContextType {
  recruiters: Recruiter[];
  addRecruiter: (recruiterData: Omit<Recruiter, 'id' | 'status' | 'lastContacted'>) => void;
  updateRecruiter: (recruiter: Recruiter) => void;
  deleteRecruiter: (id: string) => void;
  getRecruiterById: (id: string) => Recruiter | undefined;
  getSentEmailsCount: () => number;
  getRepliedEmailsCount: () => number;
}

const RecruitersContext = createContext<RecruitersContextType | undefined>(undefined);

const initialRecruiters: Recruiter[] = [
    {
      id: uuidv4(),
      companyName: "Tech Solutions Inc.",
      recruiterName: "Alice Wonderland",
      title: "Senior Talent Acquisition Specialist",
      email: "alice.wonderland@techsolutions.example.com",
      linkedInProfileUrl: "https://linkedin.com/in/alicewonderland",
      status: "pending",
      notes: "Focuses on AI and ML roles. Mentioned interest in proactive candidates on LinkedIn."
    },
    {
      id: uuidv4(),
      companyName: "Innovate Hub",
      recruiterName: "Bob The Builder",
      title: "Lead Recruiter",
      email: "bob.builder@innovatehub.example.com",
      status: "sent",
      lastContacted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      personalizedEmailSubject: "Following up: Potential Fit at Innovate Hub",
      personalizedEmailBody: "Hi Bob, Hope you're having a great week..."
    },
];


export function RecruitersProvider({ children }: { children: React.ReactNode }) {
  const [recruiters, setRecruiters] = useLocalStorage<Recruiter[]>('recruiters', initialRecruiters);

  const addRecruiter = useCallback((recruiterData: Omit<Recruiter, 'id' | 'status' | 'lastContacted'>) => {
    const newRecruiter: Recruiter = {
      ...recruiterData,
      id: uuidv4(),
      status: 'pending',
    };
    setRecruiters((prev) => [newRecruiter, ...prev]);
  }, [setRecruiters]);

  const updateRecruiter = useCallback((updatedRecruiter: Recruiter) => {
    setRecruiters((prev) =>
      prev.map((r) => (r.id === updatedRecruiter.id ? updatedRecruiter : r))
    );
  }, [setRecruiters]);

  const deleteRecruiter = useCallback((id: string) => {
    setRecruiters((prev) => prev.filter((r) => r.id !== id));
  }, [setRecruiters]);

  const getRecruiterById = useCallback((id: string) => {
    return recruiters.find((r) => r.id === id);
  }, [recruiters]);

  const getSentEmailsCount = useCallback(() => {
    return recruiters.filter(r => r.status === 'sent' || r.status === 'replied').length;
  }, [recruiters]);
  
  const getRepliedEmailsCount = useCallback(() => {
    return recruiters.filter(r => r.status === 'replied').length;
  }, [recruiters]);

  const value = useMemo(() => ({
    recruiters,
    addRecruiter,
    updateRecruiter,
    deleteRecruiter,
    getRecruiterById,
    getSentEmailsCount,
    getRepliedEmailsCount,
  }), [recruiters, addRecruiter, updateRecruiter, deleteRecruiter, getRecruiterById, getSentEmailsCount, getRepliedEmailsCount]);

  return (
    <RecruitersContext.Provider value={value}>
      {children}
    </RecruitersContext.Provider>
  );
}

export function useRecruiters() {
  const context = useContext(RecruitersContext);
  if (context === undefined) {
    throw new Error('useRecruiters must be used within a RecruitersProvider');
  }
  return context;
}
