'use client';

import { PageHeader } from '@/components/layout/page-header';
import { TemplateEditor } from '@/components/templates/template-editor';
import { useTemplates } from '@/contexts/TemplatesContext';
import { useToast } from '@/hooks/use-toast';
import type { EmailTemplate, UserSkills } from '@/types';

export default function TemplatesPage() {
  const { templates, updateTemplate, userSkills, setUserSkills } = useTemplates();
  const { toast } = useToast();

  // For simplicity, we'll manage one primary template or the first one.
  // A more complex setup would allow selecting/creating multiple templates.
  const currentTemplate = templates.find(t => t.isDefault) || templates[0];

  const handleSaveTemplate = (updatedTemplate: EmailTemplate) => {
    updateTemplate(updatedTemplate);
    toast({
      title: 'Template Saved',
      description: `Template "${updatedTemplate.name}" has been updated.`,
      variant: 'default',
    });
  };
  
  const handleSaveSkills = (updatedSkills: string) => {
    setUserSkills(updatedSkills);
     toast({
      title: 'Skills Updated',
      description: `Your skills have been saved.`,
      variant: 'default',
    });
  }

  return (
    <>
      <PageHeader
        title="Email Template Editor"
        description="Customize your email templates. Use placeholders like {recruiter_name}, {company_name}, {your_name}, {your_skills}."
      />
      {currentTemplate ? (
        <TemplateEditor
          template={currentTemplate}
          userSkills={userSkills}
          onSaveTemplate={handleSaveTemplate}
          onSaveSkills={handleSaveSkills}
        />
      ) : (
        <p>No templates available. Please add a default template.</p>
      )}
    </>
  );
}
