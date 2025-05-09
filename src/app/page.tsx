'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, MailPlus, LineChart, FileText, ArrowRight } from 'lucide-react';
import { useRecruiters } from '@/contexts/RecruitersContext'; // Assuming context setup

export default function DashboardPage() {
  const { recruiters, getSentEmailsCount, getRepliedEmailsCount } = useRecruiters ? useRecruiters() : { recruiters: [], getSentEmailsCount: () => 0, getRepliedEmailsCount: () => 0 };

  const totalRecruiters = recruiters.length;
  const emailsSent = getSentEmailsCount ? getSentEmailsCount() : 0;
  // Mocked data for now
  const openRate = emailsSent > 0 ? 45.5 : 0; // Example open rate
  const replyRate = getRepliedEmailsCount ? (emailsSent > 0 ? (getRepliedEmailsCount() / emailsSent) * 100 : 0) : 0;


  const stats = [
    { title: 'Total Recruiters', value: totalRecruiters.toString(), icon: Users, color: 'text-sky-500' },
    { title: 'Emails Sent', value: emailsSent.toString(), icon: MailPlus, color: 'text-teal-500' },
    { title: 'Open Rate', value: `${openRate.toFixed(1)}%`, icon: LineChart, color: 'text-amber-500' },
    { title: 'Reply Rate', value: `${replyRate.toFixed(1)}%`, icon: LineChart, color: 'text-emerald-500' },
  ];

  const quickActions = [
    { title: 'Add New Recruiter', href: '/recruits/add', icon: Users, description: 'Input new recruiter details.' },
    { title: 'View All Recruits', href: '/recruits', icon: Users, description: 'Review and manage your list.' },
    { title: 'Manage Templates', href: '/templates', icon: FileText, description: 'Edit your email templates.' },
    { title: 'View Analytics', href: '/analytics', icon: LineChart, description: 'Track your campaign performance.' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome to CyberConnect AI. Here's an overview of your outreach."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {quickActions.map((action) => (
            <Card key={action.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <action.icon className="h-8 w-8 text-accent" />
                  <CardTitle className="text-xl text-foreground">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{action.description}</p>
                <Button asChild variant="outline" className="w-full sm:w-auto group hover:bg-accent hover:text-accent-foreground">
                  <Link href={action.href}>
                    Go to {action.title}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Placeholder for recent activity or other dashboard elements */}
      {/*
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>
      */}
    </>
  );
}
