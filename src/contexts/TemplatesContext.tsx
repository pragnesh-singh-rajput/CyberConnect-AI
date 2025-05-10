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
  addTemplate: (templateData: Omit<EmailTemplate, 'id' | 'isDefault'>, makeDefault?: boolean) => EmailTemplate;
  deleteTemplate: (id: string) => void;
  setUserSkills: (skills: string) => void;
  setDefaultTemplate: (id: string) => void;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

const initialTemplates: EmailTemplate[] = [];

const initialUserSkills: UserSkills = {
  skills: '',
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
  
  const setDefaultTemplate = useCallback((id: string) => {
    setTemplates(prev => 
      prev.map(t => ({
        ...t,
        isDefault: t.id === id,
      }))
    );
  }, [setTemplates]);

  const addTemplate = useCallback((templateData: Omit<EmailTemplate, 'id' | 'isDefault'>, makeDefault: boolean = false): EmailTemplate => {
    const newTemplate: EmailTemplate = { 
      ...templateData, 
      id: uuidv4(),
      isDefault: false // Initially false, will be set if makeDefault is true
    };
    
    setTemplates(prev => {
      let newTemplates = [...prev];
      if (makeDefault || newTemplates.length === 0) {
        newTemplates = newTemplates.map(t => ({ ...t, isDefault: false }));
        newTemplate.isDefault = true;
      }
      return [newTemplate, ...newTemplates];
    });
    return newTemplate;
  }, [setTemplates]);


  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => {
      const remainingTemplates = prev.filter(t => t.id !== id);
      // If the deleted template was default, and there are other templates, make the first one default
      if (remainingTemplates.length > 0 && prev.find(t => t.id === id)?.isDefault) {
        remainingTemplates[0].isDefault = true;
      }
      return remainingTemplates;
    });
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
    setDefaultTemplate,
  }), [templates, userSkills, getTemplateById, getDefaultTemplate, updateTemplate, addTemplate, deleteTemplate, setUserSkills, setDefaultTemplate]);

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
