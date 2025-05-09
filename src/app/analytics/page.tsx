'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, PieChart as PieLucide, Users, Mail, TrendingUp, CheckCircle } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';
import { useRecruiters } from '@/contexts/RecruitersContext';

const mockSentOverTimeData = [
  { date: 'Jan', count: 10 },
  { date: 'Feb', count: 15 },
  { date: 'Mar', count: 12 },
  { date: 'Apr', count: 20 },
  { date: 'May', count: 25 },
  { date: 'Jun', count: 18 },
];

const mockCampaignPerformanceData = [
  { name: 'Campaign A', sent: 100, opened: 60, replied: 15 },
  { name: 'Campaign B', sent: 150, opened: 90, replied: 20 },
];

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];


export default function AnalyticsPage() {
  const { recruiters, getSentEmailsCount, getRepliedEmailsCount } = useRecruiters ? useRecruiters() : { recruiters: [], getSentEmailsCount: () => 0, getRepliedEmailsCount: () => 0 };

  const totalRecruiters = recruiters.length;
  const emailsSent = getSentEmailsCount();
  const emailsReplied = getRepliedEmailsCount();
  const emailsOpened = Math.floor(emailsSent * 0.455); // Mocked: 45.5% open rate
  
  const conversionRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;

  const statusCounts = recruiters.reduce((acc, recruiter) => {
    acc[recruiter.status] = (acc[recruiter.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));


  const stats = [
    { title: 'Total Recruiters Added', value: totalRecruiters, icon: Users },
    { title: 'Total Emails Sent', value: emailsSent, icon: Mail },
    { title: 'Emails Opened (Est.)', value: emailsOpened, icon: TrendingUp },
    { title: 'Emails Replied', value: emailsReplied, icon: CheckCircle },
    { title: 'Conversion Rate (Reply)', value: `${conversionRate.toFixed(1)}%`, icon: PieLucide },
  ];

  return (
    <>
      <PageHeader
        title="Email Campaign Analytics"
        description="Track the performance of your outreach efforts."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat, index) => (
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-foreground">
              <LineChart className="mr-2 h-5 w-5 text-accent" /> Emails Sent Over Time (Mock)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={mockSentOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6, fill: 'hsl(var(--chart-1))' }} name="Emails Sent" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-foreground">
              <BarChart className="mr-2 h-5 w-5 text-accent" /> Campaign Performance (Mock)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={mockCampaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
                <Bar dataKey="sent" fill="hsl(var(--chart-1))" name="Sent" />
                <Bar dataKey="opened" fill="hsl(var(--chart-2))" name="Opened" />
                <Bar dataKey="replied" fill="hsl(var(--chart-3))" name="Replied" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-foreground">
              <PieLucide className="mr-2 h-5 w-5 text-accent" /> Recruiter Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    stroke="hsl(var(--border))"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">No recruiter data available to display status distribution.</p>
            )}
          </CardContent>
        </Card>
    </>
  );
}
