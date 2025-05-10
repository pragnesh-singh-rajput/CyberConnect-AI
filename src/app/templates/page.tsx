'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { TemplateEditor } from '@/components/templates/template-editor';
import { AddTemplateDialog } from '@/components/templates/add-template-dialog';
import { useTemplates } from '@/contexts/TemplatesContext';
import { useToast } from '@/hooks/use-toast';
import type { EmailTemplate, UserSkills } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TemplatesPage() {
  const { templates, updateTemplate, userSkills, setUserSkills, addTemplate, deleteTemplate, getDefaultTemplate, setDefaultTemplate } = useTemplates();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Determine current template: if a default is set, use it. Otherwise, use the first one.
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | undefined>(() => getDefaultTemplate()?.id);
  
  React.useEffect(() => {
    const defaultTemplate = getDefaultTemplate();
    if (defaultTemplate && selectedTemplateId !== defaultTemplate.id) {
      setSelectedTemplateId(defaultTemplate.id);
    } else if (!defaultTemplate && templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id); // Fallback to first if no default and none selected
    }
  }, [templates, getDefaultTemplate, selectedTemplateId]);


  const currentTemplate = templates.find(t => t.id === selectedTemplateId);

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
  };

  const handleAddTemplate = (name: string, subject: string, body: string, makeDefault: boolean) => {
    const newTemplate = addTemplate({ name, subject, body }, makeDefault);
    toast({
      title: 'Template Added',
      description: `New template "${name}" has been created.`,
      variant: 'default',
    });
    setSelectedTemplateId(newTemplate.id); // Select the newly added template
    setIsAddDialogOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one email template.",
        variant: "destructive",
      });
      return;
    }
    deleteTemplate(id);
    toast({
      title: 'Template Deleted',
      description: 'The template has been deleted.',
      variant: 'default',
    });
    // If the deleted template was selected, select the new default or first template
    if (selectedTemplateId === id) {
      const newDefault = getDefaultTemplate() || (templates.length > 0 ? templates[0] : undefined);
      setSelectedTemplateId(newDefault?.id);
    }
  };

  const handleSetDefaultTemplate = (id: string) => {
    setDefaultTemplate(id);
     toast({
      title: 'Default Template Set',
      description: 'This template will now be used by default.',
      variant: 'default',
    });
  }


  return (
    <>
      <PageHeader
        title="Email Template Editor"
        description="Customize your email templates. Use placeholders like {recruiter_name}, {company_name}, {your_name}, {your_skills}."
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Template
          </Button>
        }
      />

      {templates.length > 0 && currentTemplate && (
        <div className="mb-6">
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="w-full md:w-[300px] mb-4 shadow-sm">
              <SelectValue placeholder="Select a template to edit" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {t.isDefault && '(Default)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {templates.length === 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Templates Found</CardTitle>
            <CardDescription>You don't have any email templates yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">Click the button below to create your first email template.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : currentTemplate ? (
        <TemplateEditor
          key={currentTemplate.id} // Ensure re-render when template changes
          template={currentTemplate}
          userSkills={userSkills}
          onSaveTemplate={handleSaveTemplate}
          onSaveSkills={handleSaveSkills}
          onDeleteTemplate={handleDeleteTemplate}
          onSetDefaultTemplate={handleSetDefaultTemplate}
          canDelete={templates.length > 1}
        />
      ) : (
         <Card className="shadow-lg">
           <CardHeader className="flex-row items-center gap-2">
             <Info className="h-6 w-6 text-accent" />
             <CardTitle>Select a Template</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">Please select a template from the dropdown above to start editing, or add a new one.</p>
           </CardContent>
         </Card>
      )}
      <AddTemplateDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTemplate={handleAddTemplate}
      />
    </>
  );
}
