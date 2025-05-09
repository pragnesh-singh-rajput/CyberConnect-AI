'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast'; // Corrected import path
import { Settings, UserCircle } from 'lucide-react';

export default function SidebarActions() {
  const { toast } = useToast();

  const handleSettingsClick = () => {
    toast({
      title: 'Coming Soon!',
      description: 'The Settings page is currently under development.',
      variant: 'default',
    });
  };

  const handleProfileClick = () => {
    toast({
      title: 'Coming Soon!',
      description: 'The Profile page is currently under development.',
      variant: 'default',
    });
  };

  return (
    <>
      <Button variant="ghost" className="w-full justify-start" onClick={handleSettingsClick}>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={handleProfileClick}>
        <UserCircle className="mr-2 h-4 w-4" /> Profile
      </Button>
    </>
  );
}
