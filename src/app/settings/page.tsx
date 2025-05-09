
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Bell, User, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would save these settings.
    toast({
      title: 'Settings Saved (Simulated)',
      description: 'Your preferences have been updated.',
      variant: 'default',
    });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your application preferences and account settings."
      />
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <User className="mr-2 h-5 w-5 text-accent" /> Account Settings
            </CardTitle>
            <CardDescription>Update your personal information and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="Demo User" placeholder="Enter your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="demo@example.com" placeholder="Enter your email" />
            </div>
            <Button variant="outline" type="button" onClick={() => toast({ title: 'Password Change', description: 'Password change functionality is not yet implemented.'})}>
              Change Password
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Bell className="mr-2 h-5 w-5 text-accent" /> Notification Preferences
            </CardTitle>
            <CardDescription>Control how you receive notifications from the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates for important activities.
                </p>
              </div>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="pushNotifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get real-time alerts on your device (if supported).
                </p>
              </div>
              <Switch id="pushNotifications" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Palette className="mr-2 h-5 w-5 text-accent" /> Theme Settings
            </CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Theme customization is managed globally. Dark mode is currently enabled.
              More theme options will be available in the future.
            </p>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>
      </form>
    </>
  );
}
