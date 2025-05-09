'use client';

import type React from 'react';
import { createContext, useContext, useMemo, useCallback } from 'react';
import type { EmailTemplate, UserSkills } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { v4 as uuidv4 } from 'uuid';

interface TemplatesContextType {
  templates: EmailTemplate[];
  userSkills: UserSkills;
  getTemplateById: (id: string) => EmailTemplate | undefined;
  getDefaultTemplate: () => EmailTemplate | undefined;
  updateTemplate: (template: EmailTemplate) => void;
  addTemplate: (templateData: Omit<EmailTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  setUserSkills: (skills: string) => void;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

const initialTemplates: EmailTemplate[] = [
  {
    id: 'default-cold-email',
    name: 'Default Cold Email',
    subject: 'Inquiry about opportunities at {company_name} - {your_name}',
    body: `Dear {recruiter_name},

I hope this email finds you well.

My name is {your_name}, and I'm a [Your Current Role/Aspiration] with a strong background in {your_skills}. I've been following {company_name}'s work in [Specific Area/Industry] with great interest, particularly [Mention something specific about the company or their work].

I am very impressed with your profile and your contributions at {company_name}. Given my experience in [Mention 1-2 key skills/experiences relevant to the company/recruiter], I believe I could bring significant value to your team.

Would you be open to a brief 15-minute call next week to discuss how my skills and experiences might align with {company_name}'s goals or any suitable upcoming roles?

Thank you for your time and consideration.

Best regards,
{your_name}
[Your LinkedIn Profile URL (Optional)]
[Your Portfolio/GitHub URL (Optional)]`,
    isDefault: true,
  },
];

const initialUserSkills: UserSkills = {
  skills: 'React, Next.js, TypeScript, and AI integration',
};

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useLocalStorage<EmailTemplate[]>('emailTemplates', initialTemplates);
  const [userSkills, setUserSkillsState] = useLocalStorage<UserSkills>('userSkills', initialUserSkills);

  const getTemplateById = useCallback((id: string) => {
    return templates.find((t) => t.id === id);
  }, [templates]);

  const getDefaultTemplate = useCallback(() => {
    return templates.find((t) => t.isDefault) || templates[0];
  }, [templates]);

  const updateTemplate = useCallback((updatedTemplate: EmailTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
  }, [setTemplates]);

  const addTemplate = useCallback((templateData: Omit<EmailTemplate, 'id'>) => {
    const newTemplate: EmailTemplate = { ...templateData, id: uuidv4() };
    setTemplates(prev => [newTemplate, ...prev]);
  }, [setTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [setTemplates]);
  
  const setUserSkills = useCallback((skills: string) => {
    setUserSkillsState({ skills });
  }, [setUserSkillsState]);

  const value = useMemo(() => ({
    templates,
    userSkills,
    getTemplateById,
    getDefaultTemplate,
    updateTemplate,
    addTemplate,
    deleteTemplate,
    setUserSkills,
  }), [templates, userSkills, getTemplateById, getDefaultTemplate, updateTemplate, addTemplate, deleteTemplate, setUserSkills]);

  return (
    <TemplatesContext.Provider value={value}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
}
