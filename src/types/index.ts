export interface Recruiter {
  id: string;
  companyName: string;
  recruiterName: string;
  title: string;
  linkedInProfileUrl?: string;
  email: string;
  status: 'pending' | 'personalized' | 'sent' | 'replied' | 'saved' | 'error';
  lastContacted?: string; // ISO date string
  personalizedEmailSubject?: string;
  personalizedEmailBody?: string;
  notes?: string; // For recruiter profile info
  errorMessage?: string; // If status is 'error'
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault?: boolean;
}

export interface AnalyticsData {
  totalRecruiters: number;
  emailsSent: number;
  emailsOpened: number; // Mocked
  emailsReplied: number; // Mocked
  // For charts
  sentOverTime: { date: string; count: number }[]; // Mocked
  campaignPerformance: { name: string; sent: number; opened: number; replied: number }[]; // Mocked
}

export interface UserSkills {
  skills: string;
}
