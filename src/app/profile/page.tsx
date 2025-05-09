
'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Edit3, Mail, Phone, CalendarDays } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { toast } = useToast();

  const handleUpdateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would save these profile details.
    toast({
      title: 'Profile Updated (Simulated)',
      description: 'Your profile information has been saved.',
      variant: 'default',
    });
  };

  return (
    <>
      <PageHeader
        title="User Profile"
        description="View and manage your personal information."
      />
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4 ring-2 ring-accent ring-offset-2 ring-offset-background">
                  <Image 
                    src={`https://picsum.photos/seed/profileUser/128/128`} 
                    alt="User Avatar" 
                    width={128} 
                    height={128} 
                    className="rounded-full"
                    data-ai-hint="person portrait"
                  />
                  <AvatarFallback>DU</AvatarFallback>
                </Avatar>
              <CardTitle className="text-2xl">Demo User</CardTitle>
              <CardDescription>Premium Member</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-accent" />
                <span>demo@example.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-accent" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-accent" />
                <span>Joined: January 1, 2024</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Edit3 className="mr-2 h-5 w-5 text-accent" /> Edit Profile
              </CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Demo" placeholder="Your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="User" placeholder="Your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="demo@example.com" placeholder="Your email address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" placeholder="Your phone number" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bio">Short Bio</Label>
                    <textarea
                        id="bio"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        defaultValue="Passionate professional leveraging AI for outreach."
                        placeholder="Tell us a little about yourself"
                    />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
