'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, LineChart, PieChart as PieLucide, Users, Mail, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { useRecruiters } from '@/contexts/RecruitersContext';


const DynamicEmailsSentOverTimeChartCard = dynamic(() =>
  import('@/components/analytics/emails-sent-over-time-chart-card').then(mod => mod.EmailsSentOverTimeChartCard),
  { 
    ssr: false, 
    loading: () => <Skeleton className="w-full h-[366px] rounded-lg shadow-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></Skeleton> 
  }
);

const DynamicCampaignPerformanceChartCard = dynamic(() =>
  import('@/components/analytics/campaign-performance-chart-card').then(mod => mod.CampaignPerformanceChartCard),
  { 
    ssr: false, 
    loading: () => <Skeleton className="w-full h-[366px] rounded-lg shadow-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></Skeleton>
  }
);

const DynamicRecruiterStatusDistributionChartCard = dynamic(() =>
  import('@/components/analytics/recruiter-status-distribution-chart-card').then(mod => mod.RecruiterStatusDistributionChartCard),
  { 
    ssr: false, 
    loading: () => <Skeleton className="w-full h-[342px] rounded-lg shadow-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></Skeleton>
  }
);


export default function AnalyticsPage() {
  const { recruiters, getSentEmailsCount, getRepliedEmailsCount } = useRecruiters();

  const totalRecruiters = recruiters.length;
  const emailsSent = getSentEmailsCount();
  const emailsReplied = getRepliedEmailsCount();
  // Actual email open tracking is complex and typically requires external services or pixel tracking,
  // which is beyond the scope of this example application.
  // For now, we'll show 'N/A' or a placeholder message.
  const emailsOpenedDisplay = "N/A (Tracking not implemented)"; 
  
  const conversionRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;

  const stats = [
    { title: 'Total Recruiters Added', value: totalRecruiters, icon: Users },
    { title: 'Total Emails Sent', value: emailsSent, icon: Mail },
    { title: 'Emails Opened', value: emailsOpenedDisplay, icon: TrendingUp },
    { title: 'Emails Replied', value: emailsReplied, icon: CheckCircle },
    { title: 'Conversion Rate (Reply)', value: `${conversionRate.toFixed(1)}%`, icon: PieLucide },
  ];

  return (
    <>
      <PageHeader
        title="Email Campaign Analytics"
        description="Track the performance of your outreach efforts. Charts will populate as you interact with recruiters."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 text-accent`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <DynamicEmailsSentOverTimeChartCard />
        <DynamicCampaignPerformanceChartCard />
      </div>
      
      <DynamicRecruiterStatusDistributionChartCard />
    </>
  );
}
